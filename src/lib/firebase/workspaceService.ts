import { db } from './config';
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    Timestamp,
    arrayUnion,
    limit
} from 'firebase/firestore';

export interface Workspace {
    id: string;
    name: string;
    ownerId: string;
    memberIds: string[];
    joinCode: string;
    createdAt: Timestamp;
}

const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const workspaceService = {
    createWorkspace: async (data: Omit<Workspace, 'id' | 'joinCode' | 'createdAt'>) => {
        const workspacesRef = collection(db, 'workspaces');
        const newDocRef = doc(workspacesRef);

        const newWorkspace: Workspace = {
            ...data,
            id: newDocRef.id,
            joinCode: generateJoinCode(),
            createdAt: serverTimestamp() as Timestamp,
        };

        await setDoc(newDocRef, newWorkspace);
        return newWorkspace;
    },

    getWorkspace: async (workspaceId: string) => {
        const workspaceRef = doc(db, 'workspaces', workspaceId);
        const snapshot = await getDoc(workspaceRef);
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() } as Workspace;
        }
        return null;
    },

    getUserWorkspaces: async (userId: string) => {
        const q = query(collection(db, 'workspaces'), where('memberIds', 'array-contains', userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Workspace);
    },

    updateWorkspace: async (workspaceId: string, data: Partial<Omit<Workspace, 'id' | 'createdAt'>>) => {
        const workspaceRef = doc(db, 'workspaces', workspaceId);
        await updateDoc(workspaceRef, data);
    },

    deleteWorkspace: async (workspaceId: string) => {
        const workspaceRef = doc(db, 'workspaces', workspaceId);
        await deleteDoc(workspaceRef);
    },

    joinWorkspaceByCode: async (code: string, userId: string) => {
        const q = query(collection(db, 'workspaces'), where('joinCode', '==', code.toUpperCase()), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            throw new Error('Invalid or expired join code.');
        }

        const workspaceDoc = snapshot.docs[0];
        const workspaceRef = doc(db, 'workspaces', workspaceDoc.id);

        if (workspaceDoc.data().memberIds.includes(userId)) {
            return workspaceDoc.id; // Already a member
        }

        await updateDoc(workspaceRef, {
            memberIds: arrayUnion(userId)
        });

        return workspaceDoc.id;
    }
};
