import { useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useTaskStore } from '@/store/useTaskStore';
import { useAuthStore } from '@/store/authStore';
import { Task, taskService, TaskStatus } from '@/lib/firebase/taskService';
import { useWorkspaceStore } from '@/store/workspaceStore';

export function useTasks() {
    const { user, loading: authLoading } = useAuthStore();
    const { activeWorkspaceId } = useWorkspaceStore();
    const {
        tasks,
        loading,
        error,
        setTasks,
        setLoading,
        setError,
        // addTask, // Removed from destructuring as it's now a local function
        updateTask,
        deleteTask,
        toggleTaskStatus
    } = useTaskStore();

    useEffect(() => {
        if (authLoading) return;

        if (!user || !activeWorkspaceId) {
            setTasks([]);
            return;
        }

        setLoading(true);

        const q = query(
            collection(db, 'tasks'),
            where('workspaceId', '==', activeWorkspaceId), // Pivot: Query by Workspace
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedTasks = snapshot.docs
                    .map((doc) => ({
                        ...doc.data(),
                        id: doc.id,
                    })) as Task[];

                // Filter out bad missing-title tasks from testing
                const validTasks = fetchedTasks.filter(t => t.title && t.title.trim() !== '');

                // This will seamlessly overwrite temporary optimistic UI tasks
                setTasks(validTasks);
            },
            (err) => {
                setError(err.message);
            }
        );

        return () => unsubscribe();
    }, [user, authLoading, activeWorkspaceId, setTasks, setLoading, setError]);

    const addTask = async (data: Omit<Task, 'id' | 'workspaceId' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        if (!user || !activeWorkspaceId) return;
        try {
            await taskService.createTask(activeWorkspaceId, user.uid, data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    return {
        tasks,
        loading,
        error,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus
    };
}
