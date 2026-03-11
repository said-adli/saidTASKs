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
    getDocs,
    writeBatch,
    arrayRemove
} from 'firebase/firestore';

export interface Tag {
    id: string;
    workspaceId: string;
    name: string;
    color: string;
    userId: string;
    createdAt: Timestamp;
}

export const tagService = {
    createTag: async (workspaceId: string, userId: string, data: Omit<Tag, 'id' | 'workspaceId' | 'userId' | 'createdAt'>) => {
        const tagsRef = collection(db, 'tags');
        const newDocRef = doc(tagsRef);

        const newTag: Tag = {
            ...data,
            id: newDocRef.id,
            workspaceId,
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
        // Cascade: remove this tag ID from every task that references it
        const tasksQuery = query(collection(db, 'tasks'), where('tagIds', 'array-contains', tagId));
        const tasksSnap = await getDocs(tasksQuery);

        if (!tasksSnap.empty) {
            const batch = writeBatch(db);
            tasksSnap.docs.forEach(taskDoc => {
                batch.update(taskDoc.ref, { tagIds: arrayRemove(tagId) });
            });
            await batch.commit();
        }

        // Then delete the tag itself
        const tagRef = doc(db, 'tags', tagId);
        await deleteDoc(tagRef);
    },

    ensureDefaultTagExists: async (workspaceId: string, userId: string) => {
        const tagsQuery = query(collection(db, 'tags'), where('workspaceId', '==', workspaceId), where('userId', '==', userId));
        const tagsSnap = await getDocs(tagsQuery);
        if (tagsSnap.empty) {
            await tagService.createTag(workspaceId, userId, {
                name: 'General',
                color: '#818cf8', // indigo-400
            });
        }
    }
};
