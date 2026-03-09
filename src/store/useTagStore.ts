import { create } from 'zustand';
import { Tag } from '@/lib/firebase/tagService';

interface TagState {
    tags: Tag[];
    activeTagId: string | null;
    loading: boolean;
    error: string | null;
    setTags: (tags: Tag[]) => void;
    setActiveTagId: (tagId: string | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useTagStore = create<TagState>((set) => ({
    tags: [],
    activeTagId: null,
    loading: true,
    error: null,
    setTags: (tags) => set({ tags }),
    setActiveTagId: (activeTagId) => set({ activeTagId }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error })
}));
