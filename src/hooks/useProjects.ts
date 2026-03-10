import { useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useProjectStore } from '@/store/useProjectStore';
import { useAuthStore } from '@/store/authStore';
import { Project, projectService } from '@/lib/firebase/projectService';

export function useProjects() {
    const { user, loading: authLoading } = useAuthStore();
    const {
        projects,
        loading,
        error,
        activeProjectId,
        setProjects,
        setLoading,
        setError,
        setActiveProjectId,
        addProject,
        updateProject,
        deleteProject
    } = useProjectStore();

    const inboxChecked = useRef(false);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setProjects([]);
            return;
        }

        setLoading(true);

        if (!inboxChecked.current) {
            projectService.ensureInboxExists(user.uid).catch(console.error);
            inboxChecked.current = true;
        }

        const q = query(
            collection(db, 'projects'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetched = snapshot.docs.map((doc) => ({
                    ...doc.data(),
                    id: doc.id,
                })) as Project[];

                setProjects(fetched);
            },
            (err) => {
                setError(err.message);
            }
        );

        return () => unsubscribe();
    }, [user, authLoading, setProjects, setLoading, setError]);

    return {
        projects,
        loading,
        error,
        activeProjectId,
        setActiveProjectId,
        addProject,
        updateProject,
        deleteProject
    };
}
