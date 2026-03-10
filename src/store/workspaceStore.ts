import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Workspace } from '@/lib/firebase/workspaceService';
import { UserProfile } from '@/lib/firebase/userService';
import { doc, onSnapshot, documentId, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface WorkspaceState {
    workspaces: Workspace[];
    activeWorkspaceId: string | null;
    memberProfiles: Record<string, UserProfile>;
    loading: boolean;
    error: string | null;
    isLoungeOpen: boolean;
    setWorkspaces: (workspaces: Workspace[]) => void;
    setActiveWorkspaceId: (id: string | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setIsLoungeOpen: (isOpen: boolean) => void;
    fetchWorkspaces: (userId: string) => Promise<void>;
    subscribeToMembers: (memberIds: string[]) => void;
    unsubscribeFromMembers: () => void;
}

/**
 * Batch-fetch user profiles for given UIDs.
 * Firestore `in` queries support up to 30 items, so we chunk.
 */
async function batchFetchProfiles(uids: string[]): Promise<Record<string, UserProfile>> {
    const profiles: Record<string, UserProfile> = {};
    if (!uids.length) return profiles;

    const CHUNK_SIZE = 30;
    for (let i = 0; i < uids.length; i += CHUNK_SIZE) {
        const chunk = uids.slice(i, i + CHUNK_SIZE);
        const q = query(collection(db, 'users'), where(documentId(), 'in', chunk));
        const snap = await getDocs(q);
        snap.docs.forEach(d => {
            profiles[d.id] = { userId: d.id, ...d.data() } as UserProfile;
        });
    }
    return profiles;
}

export const useWorkspaceStore = create<WorkspaceState>()(
    persist(
        (set, get) => {
            let workspaceUnsub: (() => void) | null = null;
            let memberRefreshTimer: ReturnType<typeof setInterval> | null = null;

            return {
                workspaces: [],
                activeWorkspaceId: null,
                memberProfiles: {},
                loading: false,
                error: null,
                isLoungeOpen: false,
                setWorkspaces: (workspaces) => set({ workspaces }),
                setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
                setLoading: (loading) => set({ loading }),
                setError: (error) => set({ error }),
                setIsLoungeOpen: (isOpen) => set({ isLoungeOpen: isOpen }),
                fetchWorkspaces: async (userId: string) => {
                    set({ loading: true, error: null });
                    try {
                        const workspaces = await import('@/lib/firebase/workspaceService').then(m => m.workspaceService.getUserWorkspaces(userId));
                        set({ workspaces, loading: false });
                    } catch (err: any) {
                        set({ error: err.message, loading: false });
                    }
                },
                /**
                 * Single-listener approach: listen to the workspace document.
                 * On any change (including memberIds array updates), batch-fetch
                 * all member profiles in one query. Eliminates N separate listeners.
                 */
                subscribeToMembers: (memberIds: string[]) => {
                    const { unsubscribeFromMembers } = get();
                    unsubscribeFromMembers();

                    if (!memberIds || memberIds.length === 0) {
                        set({ memberProfiles: {} });
                        return;
                    }

                    // Initial fetch
                    batchFetchProfiles(memberIds).then(profiles => {
                        set({ memberProfiles: profiles });
                    });

                    // Periodic refresh every 30s to pick up presence changes
                    memberRefreshTimer = setInterval(() => {
                        const wsId = get().activeWorkspaceId;
                        const ws = get().workspaces.find(w => w.id === wsId);
                        if (ws?.memberIds) {
                            batchFetchProfiles(ws.memberIds).then(profiles => {
                                set({ memberProfiles: profiles });
                            });
                        }
                    }, 30_000);
                },
                unsubscribeFromMembers: () => {
                    if (workspaceUnsub) {
                        workspaceUnsub();
                        workspaceUnsub = null;
                    }
                    if (memberRefreshTimer) {
                        clearInterval(memberRefreshTimer);
                        memberRefreshTimer = null;
                    }
                }
            };
        },
        {
            name: 'workspace-storage',
            partialize: (state) => ({ activeWorkspaceId: state.activeWorkspaceId }),
        }
    )
);
