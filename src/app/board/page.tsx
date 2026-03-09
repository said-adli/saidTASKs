"use client";

import { useMemo, useState } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useTasks } from '@/hooks/useTasks';
import { Task, TaskStatus } from '@/lib/firebase/taskService';
import { useAuthStore } from '@/store/authStore';
import { useProjects } from '@/hooks/useProjects';
import { BoardColumn } from '@/components/board/BoardColumn';
import { TaskCard } from '@/components/ui/TaskCard';
import { LayoutDashboard } from 'lucide-react';

interface FirebaseTimestamp {
    toDate?: () => Date;
    seconds?: number;
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'completed', title: 'Done' }
];

export default function KanbanBoard() {
    const { user } = useAuthStore();
    const { tasks, updateTask } = useTasks();
    const { activeProjectId, projects } = useProjects();

    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px drag distance to activate, allows clicking on buttons inside cards
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Filter tasks similarly to Dashboard based on active context
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            if (activeProjectId === 'important') {
                return task.priority === 'urgent' || task.priority === 'high';
            }
            if (activeProjectId === 'today') {
                if (!task.dueDate) return false;
                const ts = task.dueDate as FirebaseTimestamp;
                const due = ts.toDate ? ts.toDate() : new Date((ts.seconds || 0) * 1000);
                const today = new Date();
                return due.getDate() === today.getDate() && due.getMonth() === today.getMonth() && due.getFullYear() === today.getFullYear();
            }
            if (activeProjectId === 'upcoming') {
                if (!task.dueDate) return false;
                const ts = task.dueDate as FirebaseTimestamp;
                const due = ts.toDate ? ts.toDate() : new Date((ts.seconds || 0) * 1000);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return due > today;
            }
            if (activeProjectId === 'inbox') {
                const inbox = projects.find(p => p.isDefault);
                return inbox ? task.projectId === inbox.id : true;
            }
            return task.projectId === activeProjectId;
        });
    }, [tasks, activeProjectId, projects]);

    const headerTitle = ['today', 'upcoming', 'important', 'inbox'].includes(activeProjectId as string)
        ? (activeProjectId as string).charAt(0).toUpperCase() + (activeProjectId as string).slice(1)
        : projects.find(p => p.id === activeProjectId)?.name || 'Board';

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full mt-20 space-y-4">
                <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">Welcome to ProductivityOS</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-lg">Please login to access your board.</p>
            </div>
        );
    }

    // --- Drag Handlers ---
    function onDragStart(event: DragStartEvent) {
        if (event.active.data.current?.type === 'Task') {
            setActiveTask(event.active.data.current.task);
        }
    }

    // We primarily care about moving tasks between columns for status changes (DragEnd)
    // For sorting within the SAME column, we'd use DragOver. 
    // For a simple status-change Kanban, handling column changes on DragEnd is usually sufficient and simpler.

    async function onDragEnd(event: DragEndEvent) {
        setActiveTask(null);
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveTask = active.data.current?.type === 'Task';
        const isOverColumn = over.data.current?.type === 'Column';
        // If we dropped over a task, grab that task's status
        const isOverTask = over.data.current?.type === 'Task';

        if (!isActiveTask) return;

        const draggedTask = active.data.current?.task as Task;
        let newStatus: TaskStatus | null = null;

        if (isOverColumn) {
            newStatus = overId as TaskStatus;
        } else if (isOverTask) {
            const overTask = over.data.current?.task as Task;
            newStatus = overTask.status;
        }

        if (newStatus && draggedTask.status !== newStatus) {
            // Optimistic update via Zustand store
            await updateTask(draggedTask.id, { status: newStatus });
        }
    }

    return (
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <LayoutDashboard className="text-indigo-500" />
                        {headerTitle} Board
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your workflow visually.</p>
                </div>
            </header>

            <div className="flex-1 overflow-x-auto overflow-y-hidden mt-6 pb-6">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                >
                    <div className="flex items-start gap-6 h-full px-2 min-w-max">
                        {COLUMNS.map((col) => {
                            const columnTasks = filteredTasks.filter(t => t.status === col.id);
                            return (
                                <BoardColumn
                                    key={col.id}
                                    id={col.id}
                                    title={col.title}
                                    tasks={columnTasks}
                                />
                            );
                        })}
                    </div>

                    <DragOverlay
                        dropAnimation={{
                            sideEffects: defaultDropAnimationSideEffects({
                                styles: {
                                    active: {
                                        opacity: '0.4',
                                    },
                                },
                            }),
                        }}
                    >
                        {activeTask ? <TaskCard task={activeTask} /> : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    );
}
