import { create } from 'zustand';
import { Task, taskService, TaskStatus } from '@/lib/firebase/taskService';
import { userService } from '@/lib/firebase/userService';
import { aiService } from '@/lib/gemini/aiService';

interface TaskStore {
    tasks: Task[];
    loading: boolean;
    error: string | null;
    // Actions
    setTasks: (tasks: Task[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // Optimistic CRUD Wrappers
    addTask: (userId: string, data: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateTask: (taskId: string, data: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    toggleTaskStatus: (taskId: string, currentStatus: TaskStatus) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
    tasks: [],
    loading: true,
    error: null,

    setTasks: (tasks) => set((state) => {
        // Atomic Update: Merge new snapshot tasks intelligently instead of full array replacement
        const oldTasksMap = new Map(state.tasks.map(t => [t.id, t]));

        const mergedTasks = tasks.map(newTask => {
            const oldTask = oldTasksMap.get(newTask.id);

            // If task exists and hasn't fundamentally changed, preserve the exact old reference 
            // to avoid React throwing away the DOM node (UI flicker)
            if (oldTask && JSON.stringify(oldTask) === JSON.stringify(newTask)) {
                return oldTask;
            }

            // Reconcile optimistic toggles: if we just checked it off locally but snapshot is stale
            if (oldTask && oldTask.status !== newTask.status) {
                // Prefer the local status if it was updated very recently (optimistic override)
                // For a robust system we'd check timestamps, but since snapshot updates are quick:
                // We'll let Firestore win to ensure truth, but the objects themselves won't recreate whole lists.
            }

            return newTask;
        });

        // Add any "temp_" tasks that haven't been saved to Firestore yet
        const tempTasks = state.tasks.filter(t => t.id.startsWith('temp_'));

        const finalTasks = [...tempTasks, ...mergedTasks].sort((a, b) => {
            const timeA = a.createdAt?.seconds || Date.now();
            const timeB = b.createdAt?.seconds || Date.now();
            return timeB - timeA;
        });

        return { tasks: finalTasks, loading: false, error: null };
    }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error, loading: false }),

    addTask: async (userId, data) => {
        // Generate a temporary ID for optimistic update
        const tempId = `temp_${Date.now()}`;
        const newTaskOptimistic = {
            ...data,
            id: tempId,
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
            const createdTask = await taskService.createTask(userId, data);

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
            await taskService.updateTask(taskId, data);

            // Trigger Gamification if checking a task off
            if (data.status === 'completed') {
                const task = get().tasks.find(t => t.id === taskId);
                if (task) await userService.rewardTaskCompletion(task.userId);
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

            // We run the firebase call seamlessly in background without awaiting before UI reaction
            taskService.toggleTaskStatus(taskId, currentStatus, taskObj).then(() => {
                // Reward if turning TO completed
                if (newStatus === 'completed' && taskObj) {
                    userService.rewardTaskCompletion(taskObj.userId).catch(console.error);
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
