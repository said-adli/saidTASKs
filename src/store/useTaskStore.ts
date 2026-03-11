import { create } from 'zustand';
import { Task, taskService, TaskStatus } from '@/lib/firebase/taskService';
import { userService } from '@/lib/firebase/userService';
import { aiService } from '@/lib/gemini/aiService';
import { activityLogService } from '@/lib/firebase/workspaceService';

interface TaskStore {
    tasks: Task[];
    loading: boolean;
    error: string | null;
    // Actions
    setTasks: (tasks: Task[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // Optimistic CRUD Wrappers
    addTask: (workspaceId: string, userId: string, data: Omit<Task, 'id' | 'workspaceId' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateTask: (taskId: string, data: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    toggleTaskStatus: (taskId: string, currentStatus: TaskStatus) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
    tasks: [],
    loading: true,
    error: null,

    setTasks: (tasks) => set((state) => {
        // Atomic Update: Merge new snapshot tasks with shallow field comparison
        const oldTasksMap = new Map(state.tasks.map(t => [t.id, t]));

        const mergedTasks = tasks.map(newTask => {
            const oldTask = oldTasksMap.get(newTask.id);

            // Shallow field comparator: check key fields instead of JSON.stringify
            if (oldTask &&
                oldTask.title === newTask.title &&
                oldTask.status === newTask.status &&
                oldTask.priority === newTask.priority &&
                oldTask.assigneeId === newTask.assigneeId &&
                oldTask.projectId === newTask.projectId &&
                oldTask.description === newTask.description &&
                oldTask.dueDate?.seconds === newTask.dueDate?.seconds &&
                oldTask.icon === newTask.icon
            ) {
                return oldTask; // Preserve reference — no re-render
            }

            return newTask;
        });

        // Add any "temp_" tasks that haven't been saved to Firestore yet
        const tempTasks = state.tasks.filter(t => {
            if (!t.id.startsWith('temp_')) return false;
            
            // Garbage Collection: Remove if older than 10 seconds
            const timestampStr = t.id.replace('temp_', '');
            const timestamp = parseInt(timestampStr, 10);
            if (!isNaN(timestamp) && Date.now() - timestamp > 10000) {
                return false;
            }

            // Reconciliation: Remove if a permanent task with the same title already exists
            const hasPermanent = tasks.some(pt => !pt.id.startsWith('temp_') && pt.title === t.title);
            if (hasPermanent) return false;

            return true;
        });

        const finalTasks = [...tempTasks, ...mergedTasks].sort((a, b) => {
            const timeA = a.createdAt?.seconds || Date.now();
            const timeB = b.createdAt?.seconds || Date.now();
            return timeB - timeA;
        });

        return { tasks: finalTasks, loading: false, error: null };
    }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error, loading: false }),

    addTask: async (workspaceId, userId, data) => {
        // Generate a temporary ID for optimistic update
        const tempId = `temp_${Date.now()}`;
        const newTaskOptimistic = {
            ...data,
            id: tempId,
            workspaceId,
            userId,
            createdAt: null as any, // Won't render Date immediately 
            updatedAt: null as any
        } as Task;

        // Optimistically update UI
        set((state) => ({
            tasks: [newTaskOptimistic, ...state.tasks]
        }));

        try {
            // It will be synced via Firebase onSnapshot automatically
            const createdTask = await taskService.createTask(workspaceId, userId, data);

            // Background AI Categorization
            if (!data.icon && data.title) {
                aiService.categorizeTask(data.title).then(result => {
                    if (result && result.icon) {
                        taskService.updateTask(createdTask.id, { icon: result.icon });
                    }
                }).catch(console.error);
            }
        } catch (err: any) {
            // Revert if failed
            set((state) => ({
                tasks: state.tasks.filter(t => t.id !== tempId),
                error: err.message
            }));
        }
    },

    updateTask: async (taskId, data) => {
        // Save original for rollback
        const originalTasks = [...get().tasks];

        // Optimistic Update
        set((state) => ({
            tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...data } : t)
        }));

        try {
            const taskObj = get().tasks.find(t => t.id === taskId);

            if (data.status === 'completed') {
                await taskService.completeTask(taskId, taskObj);
                
                // Reward Gamification XP
                if (taskObj) {
                    const rewardUserId = taskObj.assigneeId || taskObj.userId;
                    await userService.rewardTaskCompletion(rewardUserId);

                    if (taskObj.workspaceId) {
                        activityLogService.log(taskObj.workspaceId, {
                            action: 'task.completed',
                            actorId: taskObj.userId,
                            targetName: taskObj.title,
                        });
                    }
                }
            } else {
                await taskService.updateTask(taskId, data);
            }
        } catch (err: any) {
            // Rollback
            set({ tasks: originalTasks, error: err.message });
        }
    },

    deleteTask: async (taskId) => {
        const originalTasks = [...get().tasks];

        // Optimistic Delete
        set((state) => ({
            tasks: state.tasks.filter(t => t.id !== taskId)
        }));

        try {
            await taskService.deleteTask(taskId);
        } catch (err: any) {
            set({ tasks: originalTasks, error: err.message });
        }
    },

    toggleTaskStatus: async (taskId, currentStatus) => {
        const originalTasks = [...get().tasks];
        const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';

        // Optimistic UI Toggle (instant reaction)
        set((state) => ({
            tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
        }));

        // Background Sync (Fire-and-forget style for perceived speed)
        try {
            const taskObj = get().tasks.find(t => t.id === taskId);

            const syncPromise = newStatus === 'completed'
                ? taskService.completeTask(taskId, taskObj)
                : taskService.updateTask(taskId, { status: newStatus });

            syncPromise.then(() => {
                if (newStatus === 'completed' && taskObj) {
                    const rewardUserId = taskObj.assigneeId || taskObj.userId;
                    userService.rewardTaskCompletion(rewardUserId).catch(console.error);

                    if (taskObj.workspaceId) {
                        activityLogService.log(taskObj.workspaceId, {
                            action: 'task.completed',
                            actorId: taskObj.userId,
                            targetName: taskObj.title,
                        });
                    }
                }
            }).catch((err) => {
                throw err;
            });
        } catch (err: any) {
            // Revert on throw
            set({ tasks: originalTasks, error: err.message });
        }
    }
}));
