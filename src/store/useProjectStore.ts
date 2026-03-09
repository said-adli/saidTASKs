import { create } from 'zustand';
import { Project, projectService } from '@/lib/firebase/projectService';

// smart lists
export type SmartListId = 'inbox' | 'today' | 'upcoming' | 'important';

interface ProjectStore {
    projects: Project[];
    loading: boolean;
    error: string | null;
    activeProjectId: string | SmartListId;

    // Actions
    setProjects: (projects: Project[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setActiveProjectId: (id: string | SmartListId) => void;

    // Optimistic CRUD
    addProject: (userId: string, data: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateProject: (projectId: string, data: Partial<Omit<Project, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
    deleteProject: (projectId: string) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
    projects: [],
    loading: true,
    error: null,
    activeProjectId: 'inbox', // default to inbox

    setProjects: (projects) => set({ projects, loading: false, error: null }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error, loading: false }),
    setActiveProjectId: (id) => set({ activeProjectId: id }),

    addProject: async (userId, data) => {
        const tempId = `temp_proj_${Date.now()}`;
        const newProjOptimistic = {
            ...data,
            id: tempId,
            userId,
            createdAt: null as any,
            updatedAt: null as any
        } as Project;

        set((state) => ({
            projects: [...state.projects, newProjOptimistic]
        }));

        try {
            await projectService.createProject(userId, data);
        } catch (err: any) {
            set((state) => ({
                projects: state.projects.filter(p => p.id !== tempId),
                error: err.message
            }));
        }
    },

    updateProject: async (projectId, data) => {
        const original = [...get().projects];
        set((state) => ({
            projects: state.projects.map(p => p.id === projectId ? { ...p, ...data } : p)
        }));

        try {
            await projectService.updateProject(projectId, data);
        } catch (err: any) {
            set({ projects: original, error: err.message });
        }
    },

    deleteProject: async (projectId) => {
        const original = [...get().projects];
        const { activeProjectId } = get();

        set((state) => ({
            projects: state.projects.filter(p => p.id !== projectId),
            activeProjectId: activeProjectId === projectId ? 'inbox' : activeProjectId
        }));

        try {
            await projectService.deleteProject(projectId);
        } catch (err: any) {
            set({ projects: original, activeProjectId, error: err.message });
        }
    }
}));
