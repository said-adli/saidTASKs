import { db } from './config';
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    Timestamp,
    getDocs,
    query,
    where,
    writeBatch
} from 'firebase/firestore';

export interface Project {
    id: string;
    workspaceId: string;
    name: string;
    color: string;
    icon: string;
    userId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    isDefault?: boolean; // True for the auto-created "Inbox"
}

export const projectService = {
    createProject: async (workspaceId: string, userId: string, data: Omit<Project, 'id' | 'workspaceId' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        const projectsRef = collection(db, 'projects');
        const newDocRef = doc(projectsRef);

        const newProject: Project = {
            ...data,
            id: newDocRef.id,
            workspaceId,
            userId,
            createdAt: serverTimestamp() as Timestamp,
            updatedAt: serverTimestamp() as Timestamp,
        };

        await setDoc(newDocRef, newProject);
        return newProject;
    },

    updateProject: async (projectId: string, data: Partial<Omit<Project, 'id' | 'userId' | 'createdAt'>>) => {
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
    },

    deleteProject: async (projectId: string) => {
        // Cascade: delete all tasks linked to this project first
        const tasksQuery = query(collection(db, 'tasks'), where('projectId', '==', projectId));
        const tasksSnap = await getDocs(tasksQuery);

        if (!tasksSnap.empty) {
            const batch = writeBatch(db);
            tasksSnap.docs.forEach(taskDoc => {
                batch.delete(taskDoc.ref);
            });
            await batch.commit();
        }

        // Then delete the project itself
        const projectRef = doc(db, 'projects', projectId);
        await deleteDoc(projectRef);
    },

    ensureInboxExists: async (workspaceId: string, userId: string) => {
        const q = query(collection(db, 'projects'), where('workspaceId', '==', workspaceId), where('userId', '==', userId), where('isDefault', '==', true));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return await projectService.createProject(workspaceId, userId, {
                name: 'Inbox',
                color: '#6366f1', // Indigo 500
                icon: 'inbox',
                isDefault: true
            });
        }

        return {
            ...snapshot.docs[0].data(),
            id: snapshot.docs[0].id
        } as Project;
    }
};
