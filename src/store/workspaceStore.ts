import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Workspace } from '@/lib/firebase/workspaceService';
import { UserProfile } from '@/lib/firebase/userService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface WorkspaceState {
    workspaces: Workspace[];
    activeWorkspaceId: string | null;
    memberProfiles: Record<string, UserProfile>;
    loading: boolean;
    error: string | null;
    setWorkspaces: (workspaces: Workspace[]) => void;
    setActiveWorkspaceId: (id: string | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    fetchWorkspaces: (userId: string) => Promise<void>;
    subscribeToMembers: (memberIds: string[]) => void;
    unsubscribeFromMembers: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
    persist(
        (set, get) => {
            let unsubscribers: (() => void)[] = [];

            return {
                workspaces: [],
                activeWorkspaceId: null,
                memberProfiles: {},
                loading: false,
                error: null,
                setWorkspaces: (workspaces) => set({ workspaces }),
                setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
                setLoading: (loading) => set({ loading }),
                setError: (error) => set({ error }),
                fetchWorkspaces: async (userId: string) => {
                    set({ loading: true, error: null });
                    try {
                        const workspaces = await import('@/lib/firebase/workspaceService').then(m => m.workspaceService.getUserWorkspaces(userId));
                        set({ workspaces, loading: false });
                    } catch (err: any) {
                        set({ error: err.message, loading: false });
                    }
                },
                subscribeToMembers: (memberIds: string[]) => {
                    const { unsubscribeFromMembers } = get();
                    unsubscribeFromMembers(); // Clear existing listeners

                    set({ memberProfiles: {} }); // Reset

                    if (!memberIds || memberIds.length === 0) return;

                    const newUnsubscribers = memberIds.map(uid => {
                        const userRef = doc(db, 'users', uid);
                        return onSnapshot(userRef, (docSnap) => {
                            if (docSnap.exists()) {
                                const profile = { userId: docSnap.id, ...docSnap.data() } as UserProfile;
                                set((state) => ({
                                    memberProfiles: {
                                        ...state.memberProfiles,
                                        [profile.userId]: profile
                                    }
                                }));
                            }
                        });
                    });

                    unsubscribers = newUnsubscribers;
                },
                unsubscribeFromMembers: () => {
                    unsubscribers.forEach(unsub => unsub());
                    unsubscribers = [];
                }
            };
        },
        {
            name: 'workspace-storage',
            partialize: (state) => ({ activeWorkspaceId: state.activeWorkspaceId }),
        }
    )
);
