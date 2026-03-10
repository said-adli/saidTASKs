import { Task, TaskPriority } from '@/lib/firebase/taskService';
import { CheckCircle2, Circle, Clock, MoreVertical, Trash2, CalendarDays, Paperclip, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTasks } from '@/hooks/useTasks';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';

interface TaskItemProps {
    task: Task;
}

const priorityColors: Record<TaskPriority, string> = {
    urgent: 'text-red-600 bg-red-100 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-900',
    high: 'text-orange-600 bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 border-orange-200 dark:border-orange-900',
    medium: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-500/10 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900',
    low: 'text-blue-600 bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-900',
};

export function TaskItem({ task }: TaskItemProps) {
    const { toggleTaskStatus, deleteTask } = useTasks();
    const { memberProfiles } = useWorkspaceStore();
    const { user } = useAuthStore();
    const isCompleted = task.status === 'completed';

    const assignee = task.assigneeId ? memberProfiles[task.assigneeId] : null;

    const handleDelete = async () => {
        try {
            await deleteTask(task.id);
            toast.success('Task deleted successfully');
        } catch (error) {
            toast.error('Failed to delete task');
        }
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

        if (diffDays < 0) return { label: 'Overdue', color: 'text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-900/50' };
        if (diffDays === 0) return { label: 'Today', color: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-900/50' };
        if (diffDays === 1) return { label: 'Tomorrow', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-900/50' };
        return { label: `In ${diffDays}d`, color: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700' };
    };

    const dueBadge = getDueDateLabel(task.dueDate);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
                "group flex items-start gap-4 p-4 rounded-lg border bg-white dark:bg-zinc-900 transition-colors",
                isCompleted
                    ? "opacity-60 border-zinc-200 dark:border-zinc-800"
                    : "border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md"
            )}
        >

            {/* Status Toggle Header */}
            <button
                onClick={() => {
                    // Permission guard: only creator or assignee can toggle completion
                    const canToggle = task.userId === user?.uid || task.assigneeId === user?.uid || !task.assigneeId;
                    if (!canToggle) {
                        toast.error('Only the creator or assignee can mark this task as completed.');
                        return;
                    }
                    toggleTaskStatus(task.id, task.status);
                }}
                className="mt-1 flex-shrink-0 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
                {isCompleted ? (
                    <CheckCircle2 size={22} className="text-indigo-600 dark:text-indigo-400" />
                ) : (
                    <Circle size={22} />
                )}
            </button>

            {/* Task Content */}
            <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center justify-between gap-4">
                    <h3 className={cn(
                        "text-base font-semibold truncate transition-colors flex items-center gap-2",
                        isCompleted ? "text-zinc-500 line-through" : "text-zinc-900 dark:text-zinc-100"
                    )}>
                        {task.icon && <span className="text-lg">{task.icon}</span>}
                        {task.title}
                    </h3>
                    <div className="flex items-center gap-1">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full border capitalize font-medium flex-shrink-0", priorityColors[task.priority])}>
                            {task.priority}
                        </span>
                        {assignee && (
                            <div
                                className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center overflow-hidden shrink-0 border border-white dark:border-zinc-900 shadow-sm ml-1"
                                title={`Assigned to ${assignee.displayName || 'User'}`}
                            >
                                {assignee.photoURL ? (
                                    <img src={assignee.photoURL} alt={assignee.displayName || ''} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                                        {assignee.displayName ? assignee.displayName.charAt(0).toUpperCase() : 'U'}
                                    </span>
                                )}
                            </div>
                        )}
                        <div className="flex items-center ml-2 border-l border-zinc-200 dark:border-zinc-800 pl-2">
                            <button
                                onClick={() => toast('Edit feature coming soon!', { icon: '✏️' })}
                                className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-md transition-all"
                                title="Edit Task"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-all"
                                title="Delete Task"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {task.description && (
                    <p className={cn(
                        "text-sm line-clamp-2 mt-1",
                        isCompleted ? "text-zinc-400" : "text-zinc-600 dark:text-zinc-400"
                    )}>
                        {task.description}
                    </p>
                )}

                {task.subtasks && task.subtasks.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 max-w-xs">
                        <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className={cn("h-full rounded-full transition-all", isCompleted ? "bg-zinc-300 dark:bg-zinc-700" : "bg-indigo-500")}
                                style={{ width: `${(task.subtasks.filter(st => st.isCompleted).length / task.subtasks.length) * 100}%` }}
                            />
                        </div>
                        <span className={cn("text-xs font-medium whitespace-nowrap", isCompleted ? "text-zinc-400" : "text-zinc-500")}>
                            {task.subtasks.filter(st => st.isCompleted).length}/{task.subtasks.length} subtasks
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                    {dueBadge && (
                        <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium", isCompleted ? "opacity-60 grayscale" : "", dueBadge.color)}>
                            <CalendarDays size={12} />
                            {dueBadge.label}
                        </div>
                    )}
                    {!dueBadge && (
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} />
                            <span>{task.createdAt ? new Date((task.createdAt as any).seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                        </div>
                    )}

                    {task.attachments && task.attachments.length > 0 && (
                        <div className="flex items-center gap-3 ml-2 border-l border-zinc-200 dark:border-zinc-700 pl-3">
                            {task.attachments.map(att => (
                                <a
                                    key={att.id}
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-zinc-50 dark:bg-zinc-800/50 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800"
                                >
                                    <Paperclip size={12} />
                                    <span className="max-w-[120px] truncate">{att.name}</span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
