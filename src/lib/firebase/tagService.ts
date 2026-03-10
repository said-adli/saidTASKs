import { db } from './config';
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    Timestamp,
    query,
    where,
    getDocs
} from 'firebase/firestore';

export interface Tag {
    id: string;
    name: string;
    color: string;
    userId: string;
    createdAt: Timestamp;
}

export const tagService = {
    createTag: async (userId: string, data: Omit<Tag, 'id' | 'userId' | 'createdAt'>) => {
        const tagsRef = collection(db, 'tags');
        const newDocRef = doc(tagsRef);

        const newTag: Tag = {
            ...data,
            id: newDocRef.id,
            userId,
            createdAt: serverTimestamp() as Timestamp,
        };

        await setDoc(newDocRef, newTag);
        return newTag;
    },

    updateTag: async (tagId: string, data: Partial<Omit<Tag, 'id' | 'userId' | 'createdAt'>>) => {
        const tagRef = doc(db, 'tags', tagId);
        await updateDoc(tagRef, data);
    },

    deleteTag: async (tagId: string) => {
        const tagRef = doc(db, 'tags', tagId);
        await deleteDoc(tagRef);
    },

    ensureDefaultTagExists: async (userId: string) => {
        const tagsQuery = query(collection(db, 'tags'), where('userId', '==', userId));
        const tagsSnap = await getDocs(tagsQuery);
        if (tagsSnap.empty) {
            await tagService.createTag(userId, {
                name: 'General',
                color: '#818cf8', // indigo-400
            });
        }
    }
};
