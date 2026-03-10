import { useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useTaskStore } from '@/store/useTaskStore';
import { useAuthStore } from '@/store/authStore';
import { Task } from '@/lib/firebase/taskService';

export function useTasks() {
    const { user, loading: authLoading } = useAuthStore();
    const {
        tasks,
        loading,
        error,
        setTasks,
        setLoading,
        setError,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus
    } = useTaskStore();

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setTasks([]);
            return;
        }

        setLoading(true);

        const q = query(
            collection(db, 'tasks'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedTasks = snapshot.docs.map((doc) => ({
                    ...doc.data(),
                    id: doc.id,
                })) as Task[];

                // This will seamlessly overwrite temporary optimistic UI tasks
                setTasks(fetchedTasks);
            },
            (err) => {
                setError(err.message);
            }
        );

        return () => unsubscribe();
    }, [user, authLoading, setTasks, setLoading, setError]);

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
