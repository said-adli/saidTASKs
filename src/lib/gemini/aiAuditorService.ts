import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";
import { Task } from "@/lib/firebase/taskService";
import { UserProfile } from "@/lib/firebase/userService";
import { ActivityLogEntry } from "@/lib/firebase/workspaceService";
import { chatService } from "@/lib/firebase/chatService";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
    console.warn("NEXT_PUBLIC_GEMINI_API_KEY is not set.");
}

const genAI = new GoogleGenerativeAI(apiKey || "dummy_key");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

export interface WorkspaceAuditInsight {
    type: 'success' | 'warning' | 'info';
    message: string;
}

export interface WorkspaceAuditResult {
    insights: WorkspaceAuditInsight[];
    chatNudge?: string;
}

export const aiAuditorService = {
    /**
     * Analyze workspace state and provide actionable insights + potential chat nudges.
     */
    generateAuditorInsights: async (
        workspaceName: string,
        tasks: Task[],
        members: UserProfile[],
        recentActivity: ActivityLogEntry[]
    ): Promise<WorkspaceAuditResult> => {
        if (!apiKey) throw new Error('Gemini API key is missing');

        const prompt = `
You are an expert Medical Project Manager AI named "Antigravity Auditor", specializing in Hospital Hygiene auditing and compliance. Your goal is to analyze the state of a medical team workspace called "${workspaceName}" and provide deeply actionable, highly concise insights to the workspace owner focusing on hospital hygiene standards, compliance risks, and team capacity. Do NOT give generic advice. Be brutally efficient and medical-grade professional.

Current Workspace State:
1. Members (${members.length}):
${members.map(m => `- ${m.displayName || 'Unknown'} (ID: ${m.userId})`).join('\n')}

2. Active Tasks (${tasks.length}):
${tasks.map(t => `- [${t.status}] ${t.title} | Priority: ${t.priority} | Assignee: ${members.find(m => m.userId === t.assigneeId)?.displayName || 'Unassigned'} | Due: ${t.dueDate ? new Date(t.dueDate.seconds * 1000).toDateString() : 'None'}`).join('\n')}

3. Recent Activity (Last ${recentActivity.length} events):
${recentActivity.map(a => `- ${a.actorName || a.actorId} ${a.action} ${a.targetName || ''}`).join('\n')}

Analyze the load balancing, overdue risks, completed velocity, and unassigned work.

Produce a JSON output strictly conforming to the requested schema.
`;

        const responseSchema: Schema = {
            type: SchemaType.OBJECT,
            properties: {
                insights: {
                    type: SchemaType.ARRAY,
                    description: "2-3 highly actionable, specific bullet points for the dashboard.",
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            type: {
                                type: SchemaType.STRING,
                                description: "'success' for good news, 'warning' for risks/blockers, 'info' for general state.",
                            },
                            message: {
                                type: SchemaType.STRING,
                                description: "The concise actionable text. (e.g., '3 high-priority tasks are overdue', 'Amine is overloaded with 5 active tasks')",
                            }
                        },
                        required: ["type", "message"]
                    }
                },
                chatNudge: {
                    type: SchemaType.STRING,
                    description: "An optional, friendly but firm message to drop into the team chat if there is a major blocker or deadline risk. Leave empty string if everything is fine.",
                }
            },
            required: ["insights"]
        };

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.2, // Low temperature for consistent analysis
            }
        });

        const responseText = result.response.text();
        return JSON.parse(responseText) as WorkspaceAuditResult;
    },

    /**
     * Magic Task Enrichment: Recommend Assignee and expand Description.
     */
    enrichTask: async (
        title: string,
        existingDescription: string,
        members: UserProfile[],
        tasksHistory: Task[] // To learn who usually does what
    ) => {
        if (!apiKey) throw new Error('Gemini API key is missing');

        // Build brief context of who does what
        const memberTaskCounts = members.map(m => {
            const myTasks = tasksHistory.filter(t => t.assigneeId === m.userId).map(t => t.title);
            return `- ${m.displayName || m.userId}: usually works on [${myTasks.slice(0, 3).join(', ')}]`;
        }).join('\n');

        const prompt = `
You are an AI Task Delegator. A user just created a task title: "${title}".
They left the description as: "${existingDescription}".

Your job is to:
1. Suggest a professional, detailed markdown description for this task, expanding on what needs to be done.
2. Recommend the BEST Assignee from the current member pool, based on their past task titles.

Available Members and their typical work:
${memberTaskCounts}

Produce JSON output STRICTLY conforming to the schema.
`;

        const responseSchema: Schema = {
            type: SchemaType.OBJECT,
            properties: {
                suggestedDescription: {
                    type: SchemaType.STRING,
                    description: "A professional, expanded markdown description for the task with bullet points or expected outcomes.",
                },
                recommendedAssigneeId: {
                    type: SchemaType.STRING,
                    description: "The userId of the best member to assign this to, or null if uncertain.",
                }
            },
            required: ["suggestedDescription"]
        };

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.4,
            }
        });

        const responseText = result.response.text();
        return JSON.parse(responseText) as {
            suggestedDescription: string;
            recommendedAssigneeId: string | null;
        };
    }
};
