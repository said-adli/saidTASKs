import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useTagStore } from '@/store/useTagStore';
import { useAuthStore } from '@/store/authStore';
import { tagService, Tag } from '@/lib/firebase/tagService';
import { useRef, useEffect } from 'react';

export function useTags() {
    const { tags, loading, error, setTags, setLoading, setError } = useTagStore();
    const { user, loading: authLoading } = useAuthStore();
    const defaultTagChecked = useRef(false);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setTags([]);
            setLoading(false);
            return;
        }

        if (!defaultTagChecked.current) {
            tagService.ensureDefaultTagExists(user.uid).catch(console.error);
            defaultTagChecked.current = true;
        }

        const tagsQuery = query(
            collection(db, 'tags'),
            where('userId', '==', user.uid)
        );

        setLoading(true);

        const unsubscribe = onSnapshot(tagsQuery, (snapshot) => {
            const fetchedTags = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Tag[];

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
    }, [user, authLoading, setTags, setLoading, setError]);

    const addTag = async (data: Omit<Tag, 'id' | 'userId' | 'createdAt'>) => {
        if (!user) return;
        return tagService.createTag(user.uid, data);
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
