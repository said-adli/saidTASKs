import { useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useProjectStore } from '@/store/useProjectStore';
import { useAuthStore } from '@/store/authStore';
import { Project, projectService } from '@/lib/firebase/projectService';
import { useWorkspaceStore } from '@/store/workspaceStore';

export function useProjects() {
    const { user, loading: authLoading } = useAuthStore();
    const { activeWorkspaceId } = useWorkspaceStore();
    const {
        projects,
        loading,
        error,
        activeProjectId,
        setProjects,
        setLoading,
        setError,
        setActiveProjectId,
        // addProject, // Local override
        updateProject,
        deleteProject
    } = useProjectStore();

    const inboxChecked = useRef(false);

    useEffect(() => {
        if (authLoading) return;

        if (!user || !activeWorkspaceId) {
            setProjects([]);
            return;
        }

        let unsubscribe: (() => void) | undefined;
        let isMounted = true;

        const fetchProjects = async () => {
            setLoading(true);

            if (!inboxChecked.current) {
                try {
                    await projectService.ensureInboxExists(activeWorkspaceId, user.uid);
                    inboxChecked.current = true;
                } catch (err) {
                    console.error('Failed to ensure inbox exists:', err);
                }
            }

            if (!isMounted) return;

            const q = query(
                collection(db, 'projects'),
                where('workspaceId', '==', activeWorkspaceId), // Pivot: Query by Workspace
                orderBy('createdAt', 'desc')
            );

            unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    const fetched = snapshot.docs.map((doc) => ({
                        ...doc.data(),
                        id: doc.id,
                    })) as Project[];

                    setProjects(fetched);
                    setLoading(false);
                },
                (err) => {
                    setError(err.message);
                    setLoading(false);
                }
            );
        };

        fetchProjects();

        return () => {
            isMounted = false;
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user, authLoading, activeWorkspaceId, setProjects, setLoading, setError]);

    const addProject = async (data: Omit<Project, 'id' | 'workspaceId' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        if (!user || !activeWorkspaceId) return;
        try {
            await projectService.createProject(activeWorkspaceId, user.uid, data);
        } catch (err: any) {
            setError(err.message);
        }
    };

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
