import { db } from './config';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { workspaceService } from './workspaceService';

export const migrationService = {
    migrateUserToWorkspace: async (userId: string) => {
        // Check if user already has a workspace
        const userWorkspaces = await workspaceService.getUserWorkspaces(userId);
        let personalWorkspaceId;

        if (userWorkspaces.length === 0) {
            // Create an initial personal workspace silently
            const newWorkspace = await workspaceService.createWorkspace({
                name: 'Personal Workspace',
                ownerId: userId,
                memberIds: [userId]
            });
            personalWorkspaceId = newWorkspace.id;
        } else {
            // Use their existing primary workspace
            personalWorkspaceId = userWorkspaces[0].id;
        }

        const batch = writeBatch(db);
        let operationsCount = 0;

        // Migrate Tasks
        const tasksQ = query(collection(db, 'tasks'), where('userId', '==', userId));
        const tasksSnap = await getDocs(tasksQ);
        tasksSnap.forEach(snapDoc => {
            if (!snapDoc.data().workspaceId) {
                batch.update(doc(db, 'tasks', snapDoc.id), { workspaceId: personalWorkspaceId });
                operationsCount++;
            }
        });

        // Migrate Projects
        const projectsQ = query(collection(db, 'projects'), where('userId', '==', userId));
        const projectsSnap = await getDocs(projectsQ);
        projectsSnap.forEach(snapDoc => {
            if (!snapDoc.data().workspaceId) {
                batch.update(doc(db, 'projects', snapDoc.id), { workspaceId: personalWorkspaceId });
                operationsCount++;
            }
        });

        // Migrate Tags
        const tagsQ = query(collection(db, 'tags'), where('userId', '==', userId));
        const tagsSnap = await getDocs(tagsQ);
        tagsSnap.forEach(snapDoc => {
            if (!snapDoc.data().workspaceId) {
                batch.update(doc(db, 'tags', snapDoc.id), { workspaceId: personalWorkspaceId });
                operationsCount++;
            }
        });

        if (operationsCount > 0) {
            console.log(`[Migration] Updated ${operationsCount} records with workspaceId: ${personalWorkspaceId}`);
            await batch.commit();
        }

        return personalWorkspaceId;
    }
};
