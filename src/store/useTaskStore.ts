import { create } from 'zustand';
import { Task, taskService, TaskStatus } from '@/lib/firebase/taskService';
import { userService } from '@/lib/firebase/userService';

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

    setTasks: (tasks) => set({ tasks, loading: false, error: null }),
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
            // We don't strictly *need* to replace the tempId if over-written by snapshot
            await taskService.createTask(userId, data);
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

        // Optimistic Toggle
        set((state) => ({
            tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
        }));

        try {
            const taskObj = get().tasks.find(t => t.id === taskId);
            await taskService.toggleTaskStatus(taskId, currentStatus, taskObj);

            // Reward if turning TO completed
            if (newStatus === 'completed') {
                if (taskObj) await userService.rewardTaskCompletion(taskObj.userId);
            }
        } catch (err: any) {
            set({ tasks: originalTasks, error: err.message });
        }
    }
}));
