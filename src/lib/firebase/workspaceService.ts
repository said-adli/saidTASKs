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
    orderBy,
    serverTimestamp,
    Timestamp,
    arrayUnion,
    limit,
    addDoc,
    onSnapshot,
} from 'firebase/firestore';

export interface Workspace {
    id: string;
    name: string;
    ownerId: string;
    memberIds: string[];
    joinCode: string;
    createdAt: Timestamp;
}

export interface ActivityLogEntry {
    id: string;
    action: 'task.created' | 'task.completed' | 'task.assigned' | 'member.joined';
    actorId: string;
    actorName?: string;
    targetName?: string;
    assigneeName?: string;
    timestamp: Timestamp;
}

const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const workspaceService = {
    createWorkspace: async (data: Omit<Workspace, 'id' | 'joinCode' | 'createdAt'>) => {
        const workspacesRef = collection(db, 'workspaces');
        const newDocRef = doc(workspacesRef);
        const joinCode = generateJoinCode();

        const newWorkspace: Workspace = {
            ...data,
            id: newDocRef.id,
            joinCode,
            createdAt: serverTimestamp() as Timestamp,
        };

        await setDoc(newDocRef, newWorkspace);

        // Write the public joinCode lookup entry
        await setDoc(doc(db, 'joinCodes', joinCode), {
            workspaceId: newDocRef.id,
            createdAt: serverTimestamp(),
        });

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

    /**
     * Join via the public /joinCodes lookup table (no workspace read needed).
     */
    joinWorkspaceByCode: async (code: string, userId: string) => {
        const normalizedCode = code.trim().toUpperCase();

        // Step 1: Public read from /joinCodes/{code}
        const codeRef = doc(db, 'joinCodes', normalizedCode);
        const codeSnap = await getDoc(codeRef);

        if (!codeSnap.exists()) {
            throw new Error('Invalid or expired join code.');
        }

        const { workspaceId } = codeSnap.data() as { workspaceId: string };

        // Step 2: Self-join (security rules allow appending own uid to memberIds)
        const workspaceRef = doc(db, 'workspaces', workspaceId);
        await updateDoc(workspaceRef, {
            memberIds: arrayUnion(userId)
        });

        return workspaceId;
    }
};

// --- Activity Log Service ---
export const activityLogService = {
    log: async (
        workspaceId: string,
        entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>
    ) => {
        try {
            const logRef = collection(db, 'workspaces', workspaceId, 'activityLog');
            await addDoc(logRef, {
                ...entry,
                timestamp: serverTimestamp(),
            });
        } catch (err) {
            console.error('[ActivityLog] Failed to write:', err);
        }
    },

    subscribe: (workspaceId: string, callback: (entries: ActivityLogEntry[]) => void) => {
        const logRef = collection(db, 'workspaces', workspaceId, 'activityLog');
        const q = query(logRef, orderBy('timestamp', 'desc'), limit(30));

        return onSnapshot(q, (snapshot) => {
            const entries = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
            })) as ActivityLogEntry[];
            callback(entries);
        });
    },

    getRecentLogs: async (workspaceId: string, limitCount: number = 20): Promise<ActivityLogEntry[]> => {
        try {
            const logRef = collection(db, 'workspaces', workspaceId, 'activityLog');
            const q = query(logRef, orderBy('timestamp', 'desc'), limit(limitCount));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ActivityLogEntry[];
        } catch (err) {
            console.error('[ActivityLog] Failed to fetch:', err);
            return [];
        }
    }
};
