import { useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useTaskStore } from '@/store/useTaskStore';
import { useAuthStore } from '@/store/authStore';
import { Task, taskService, TaskStatus } from '@/lib/firebase/taskService';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { activityLogService } from '@/lib/firebase/workspaceService';

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

                // Filter out bad missing-title tasks and DELETE them from Firestore permanently!
                const validTasks: Task[] = [];
                
                fetchedTasks.forEach(t => {
                    if (!t.title || typeof t.title !== 'string' || t.title.trim() === '') {
                        console.warn('Deleting ghost/corrupted task:', t.id);
                        taskService.deleteTask(t.id).catch(console.error);
                    } else {
                        validTasks.push(t);
                    }
                });

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
            const result = await taskService.createTask(activeWorkspaceId, user.uid, data);

            // Log task creation
            activityLogService.log(activeWorkspaceId, {
                action: 'task.created',
                actorId: user.uid,
                actorName: user.displayName || undefined,
                targetName: data.title,
            });

            // Log assignment if assigned
            if (data.assigneeId && data.assigneeId !== user.uid) {
                const { memberProfiles } = useWorkspaceStore.getState();
                const assignee = memberProfiles[data.assigneeId];
                activityLogService.log(activeWorkspaceId, {
                    action: 'task.assigned',
                    actorId: user.uid,
                    actorName: user.displayName || undefined,
                    targetName: data.title,
                    assigneeName: assignee?.displayName || undefined,
                });
            }
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
