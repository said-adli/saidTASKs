// src/lib/voice/commandParser.ts
import { TaskPriority } from '@/lib/firebase/taskService';

export interface ParsedCommand {
    intent: 'ADD_TASK' | 'NAVIGATE' | 'UNKNOWN';
    payload: any;
}

export const commandParser = {
    parseCommand: (text: string): ParsedCommand => {
        const lowerText = text.toLowerCase().trim();

        // 1. ADD TASK Intent
        // Examples: "Add task finish the presentation", "Create task buy milk", "Remind me to call John"
        const addTaskRegex = /^(add task|create task|remind me to) (.+)/i;
        const addMatch = text.match(addTaskRegex);

        if (addMatch && addMatch[2]) {
            let taskTitle = addMatch[2].trim();
            // Optional: crude priority parsing
            let priority: TaskPriority = 'medium';
            if (taskTitle.toLowerCase().includes('urgent')) {
                priority = 'urgent';
                taskTitle = taskTitle.replace(/urgent/i, '').trim();
            } else if (taskTitle.toLowerCase().includes('high priority')) {
                priority = 'high';
                taskTitle = taskTitle.replace(/high priority/i, '').trim();
            }

            // Cap off the first char
            taskTitle = taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1);

            return {
                intent: 'ADD_TASK',
                payload: {
                    title: taskTitle,
                    priority
                }
            };
        }

        // 2. NAVIGATE Intent
        // Examples: "Go to board", "Show analytics", "Open dashboard", "Check my stats"
        if (/(go to|open|show) (board|kanban)/.test(lowerText)) {
            return { intent: 'NAVIGATE', payload: { route: '/board' } };
        }
        if (/(go to|open|show) (dashboard|home)/.test(lowerText)) {
            return { intent: 'NAVIGATE', payload: { route: '/' } };
        }
        if (/(go to|open|show) (calendar)/.test(lowerText)) {
            return { intent: 'NAVIGATE', payload: { route: '/calendar' } };
        }
        if (/(go to|open|show) (analytics|stats)|check my stats/.test(lowerText)) {
            return { intent: 'NAVIGATE', payload: { route: '/analytics' } };
        }

        // Unknown Intent
        return {
            intent: 'UNKNOWN',
            payload: { originalText: text }
        };
    }
}
