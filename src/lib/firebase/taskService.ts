import { db } from './config';
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
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
}

export const taskService = {
    createTask: async (userId: string, data: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        const tasksRef = collection(db, 'tasks');
        const newDocRef = doc(tasksRef);

        const newTask: Task = {
            ...data,
            id: newDocRef.id,
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

    toggleTaskStatus: async (taskId: string, currentStatus: TaskStatus, task?: Task) => {
        const newStatus: TaskStatus = currentStatus === 'completed' ? 'todo' : 'completed';
        const taskRef = doc(db, 'tasks', taskId);

        // Handle Recurring Task Cloning
        if (newStatus === 'completed' && task && task.recurringInterval && task.dueDate) {
            const nextDueDate = new Date((task.dueDate as any).seconds * 1000 || (task.dueDate as any).toDate());
            if (task.recurringInterval === 'daily') nextDueDate.setDate(nextDueDate.getDate() + 1);
            if (task.recurringInterval === 'weekly') nextDueDate.setDate(nextDueDate.getDate() + 7);
            if (task.recurringInterval === 'monthly') nextDueDate.setMonth(nextDueDate.getMonth() + 1);

            const { id, createdAt, updatedAt, ...taskData } = task;

            // Subtasks should be reset to incomplete for the cloned task
            const resetSubtasks = taskData.subtasks?.map(st => ({ ...st, isCompleted: false })) || [];

            await taskService.createTask(task.userId, {
                ...taskData,
                status: 'todo',
                dueDate: Timestamp.fromDate(nextDueDate),
                subtasks: resetSubtasks
            });
        }

        await updateDoc(taskRef, {
            status: newStatus,
            updatedAt: serverTimestamp(),
        });
        return newStatus;
    }
};
