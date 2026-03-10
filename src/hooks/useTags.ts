import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useTagStore } from '@/store/useTagStore';
import { useAuthStore } from '@/store/authStore';
import { tagService, Tag } from '@/lib/firebase/tagService';
import { useEffect } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';

let globalDefaultTagChecked = false;

export function useTags() {
    const { tags, loading, error, setTags, setLoading, setError } = useTagStore();
    const { user, loading: authLoading } = useAuthStore();
    const { activeWorkspaceId } = useWorkspaceStore();

    useEffect(() => {
        if (authLoading) return;

        if (!user || !activeWorkspaceId) {
            setTags([]);
            setLoading(false);
            return;
        }

        if (!globalDefaultTagChecked) {
            tagService.ensureDefaultTagExists(activeWorkspaceId, user.uid).catch(console.error);
            globalDefaultTagChecked = true;
        }

        const tagsQuery = query(
            collection(db, 'tags'),
            where('workspaceId', '==', activeWorkspaceId) // Pivot: Query by Workspace
        );

        setLoading(true);

        const unsubscribe = onSnapshot(tagsQuery, (snapshot) => {
            let fetchedTags = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Tag[];

            // Deduplicate by name (in case multiple were created previously)
            const uniqueTags = new Map<string, Tag>();
            fetchedTags.forEach(tag => {
                if (!uniqueTags.has(tag.name.toLowerCase())) {
                    uniqueTags.set(tag.name.toLowerCase(), tag);
                }
            });
            fetchedTags = Array.from(uniqueTags.values());

            // Sort by name client side
            fetchedTags.sort((a, b) => a.name.localeCompare(b.name));

            setTags(fetchedTags);
            setLoading(false);
            setError(null);
        }, (err) => {
            console.error("Error fetching tags", err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading, activeWorkspaceId, setTags, setLoading, setError]);

    const addTag = async (data: Omit<Tag, 'id' | 'workspaceId' | 'userId' | 'createdAt'>) => {
        if (!user || !activeWorkspaceId) return;
        return tagService.createTag(activeWorkspaceId, user.uid, data);
    };

    const updateTag = async (tagId: string, data: Partial<Omit<Tag, 'id' | 'userId' | 'createdAt'>>) => {
        return tagService.updateTag(tagId, data);
    };

    const deleteTag = async (tagId: string) => {
        return tagService.deleteTag(tagId);
    };

    return {
        tags,
        loading,
        error,
        addTag,
        updateTag,
        deleteTag
    };
}
