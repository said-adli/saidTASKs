// components/ui/TaskCard.tsx
import { Task, TaskPriority } from '@/lib/firebase/taskService';
import { Clock, CalendarDays, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useProjects } from '@/hooks/useProjects';

interface TaskCardProps {
    task: Task;
}

const priorityColors: Record<TaskPriority, string> = {
    urgent: 'text-red-700 bg-red-100 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-900',
    high: 'text-orange-700 bg-orange-100 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-900',
    medium: 'text-yellow-700 bg-yellow-100 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-900',
    low: 'text-blue-700 bg-blue-100 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-900',
};

export function TaskCard({ task }: TaskCardProps) {
    const { projects } = useProjects();
    const project = projects.find(p => p.id === task.projectId);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { type: 'Task', task } });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    const getDueDateLabel = (dueDate: any) => {
        if (!dueDate) return null;
        const due = dueDate.toDate ? dueDate.toDate() : new Date(dueDate.seconds * 1000);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDateOnly = new Date(due);
        dueDateOnly.setHours(0, 0, 0, 0);

        const diffTime = dueDateOnly.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: 'Overdue', color: 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-900/50' };
        if (diffDays === 0) return { label: 'Today', color: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50' };
        if (diffDays === 1) return { label: 'Tomorrow', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50' };
        return { label: `In ${diffDays}d`, color: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700' };
    };

    const dueBadge = getDueDateLabel(task.dueDate);

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-50 border-2 border-indigo-500 rounded-lg h-24 bg-zinc-50 dark:bg-zinc-800/50"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                "group p-3 rounded-lg border bg-white dark:bg-zinc-900 shadow-sm cursor-grab transition-all hover:scale-[1.01]",
                "border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md"
            )}
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2">
                    {task.title}
                </h4>
                <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider flex-shrink-0 border",
                    priorityColors[task.priority]
                )}>
                    {task.priority.substring(0, 3)}
                </span>
            </div>

            {task.description && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">
                    {task.description}
                </p>
            )}

            {task.subtasks && task.subtasks.length > 0 && (
                <div className="flex items-center gap-1 mt-2 mb-3">
                    <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${(task.subtasks.filter(st => st.isCompleted).length / task.subtasks.length) * 100}%` }}
                        />
                    </div>
                    <span className="text-[10px] text-zinc-500 font-medium whitespace-nowrap">
                        {task.subtasks.filter(st => st.isCompleted).length}/{task.subtasks.length}
                    </span>
                </div>
            )}

            <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
                <div className="flex items-center gap-2">
                    {dueBadge && (
                        <span className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium", dueBadge.color)}>
                            <CalendarDays size={10} />
                            {dueBadge.label}
                        </span>
                    )}
                    {!dueBadge && (
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                            <Clock size={12} />
                            <span>{task.createdAt ? new Date((task.createdAt as any).seconds * 1000).toLocaleDateString() : 'Now'}</span>
                        </div>
                    )}
                    {task.attachments && task.attachments.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-medium pl-1 border-l border-zinc-200 dark:border-zinc-700">
                            <Paperclip size={10} />
                            {task.attachments.length}
                        </div>
                    )}
                </div>

                {project && (
                    <div className="flex items-center gap-1.5">
                        <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: project.color }}
                        />
                        <span className="text-[10px] text-zinc-500 truncate max-w-[80px]">
                            {project.name}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
