import { db } from './config';
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type RecurringInterval = 'daily' | 'weekly' | 'monthly';

export interface SubTask {
    id: string;
    title: string;
    isCompleted: boolean;
}

export interface Attachment {
    id: string;
    url: string;
    publicId: string;
    name: string;
    type: string;
    size: number;
}

export interface Task {
    id: string;
    workspaceId: string;
    title: string;
    description: string; // Markdown supported
    priority: TaskPriority;
    status: TaskStatus;
    userId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    projectId?: string;
    dueDate?: Timestamp | null;
    subtasks?: SubTask[];
    tagIds?: string[];
    attachments?: Attachment[];
    recurringInterval?: RecurringInterval | null;
    icon?: string;
    assigneeId?: string | null;
}

export const taskService = {
    createTask: async (workspaceId: string, userId: string, data: Omit<Task, 'id' | 'workspaceId' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        if (!data.title || data.title.trim() === '') {
            throw new Error('Task title cannot be empty or solely whitespace.');
        }

        const tasksRef = collection(db, 'tasks');
        const newDocRef = doc(tasksRef);

        const newTask: Task = {
            ...data,
            id: newDocRef.id,
            workspaceId,
            userId,
            createdAt: serverTimestamp() as Timestamp,
            updatedAt: serverTimestamp() as Timestamp,
        };

        await setDoc(newDocRef, newTask);
        return newTask;
    },

    updateTask: async (taskId: string, data: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>) => {
        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
    },

    deleteTask: async (taskId: string) => {
        const taskRef = doc(db, 'tasks', taskId);
        await deleteDoc(taskRef);
    },

    completeTask: async (taskId: string, task?: Task) => {
        const taskRef = doc(db, 'tasks', taskId);
        
        let taskData = task;
        if (!taskData) {
            const taskDoc = await getDoc(taskRef);
            if (taskDoc.exists()) {
                taskData = { id: taskDoc.id, ...taskDoc.data() } as Task;
            }
        }

        // Handle Recurring Task Cloning
        if (taskData && taskData.recurringInterval && taskData.dueDate) {
            const nextDueDate = new Date((taskData.dueDate as any).seconds * 1000 || (taskData.dueDate as any).toDate());
            if (taskData.recurringInterval === 'daily') nextDueDate.setDate(nextDueDate.getDate() + 1);
            if (taskData.recurringInterval === 'weekly') nextDueDate.setDate(nextDueDate.getDate() + 7);
            if (taskData.recurringInterval === 'monthly') nextDueDate.setMonth(nextDueDate.getMonth() + 1);

            const { id, createdAt, updatedAt, ...restData } = taskData;
            const resetSubtasks = restData.subtasks?.map(st => ({ ...st, isCompleted: false })) || [];

            await taskService.createTask(taskData.workspaceId, taskData.userId, {
                ...restData,
                status: 'todo',
                dueDate: Timestamp.fromDate(nextDueDate),
                subtasks: resetSubtasks
            });
        }

        await updateDoc(taskRef, {
            status: 'completed',
            updatedAt: serverTimestamp(),
        });
        return 'completed';
    }
};
