// components/board/BoardColumn.tsx
import { useDroppable } from '@dnd-kit/core';
import { Task } from '@/lib/firebase/taskService';
import { TaskCard } from '@/components/ui/TaskCard';
import { cn } from '@/lib/utils';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface BoardColumnProps {
    id: string; // 'todo', 'in_progress', 'completed'
    title: string;
    tasks: Task[];
}

export function BoardColumn({ id, title, tasks }: BoardColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id,
        data: {
            type: 'Column',
            columnId: id
        }
    });

    return (
        <div className="flex flex-col h-full min-h-[500px] w-full max-w-sm shrink-0">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    {title}
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-500 font-medium">
                        {tasks.length}
                    </span>
                </h3>
            </div>

            <div
                ref={setNodeRef}
                className={cn(
                    "flex-1 p-3 rounded-xl border border-dashed transition-colors flex flex-col gap-3",
                    isOver
                        ? "bg-indigo-50/50 border-indigo-300 dark:bg-indigo-500/10 dark:border-indigo-700"
                        : "bg-zinc-50/50 border-zinc-200 dark:bg-zinc-900/50 dark:border-zinc-800"
                )}
            >
                <SortableContext
                    items={tasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {tasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                    ))}

                    {tasks.length === 0 && (
                        <div className="h-full flex items-center justify-center text-sm text-zinc-400 dark:text-zinc-500 italic p-4 text-center">
                            Drop tasks here
                        </div>
                    )}
                </SortableContext>
            </div>
        </div>
    );
}
