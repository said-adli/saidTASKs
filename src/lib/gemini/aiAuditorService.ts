import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";
import { Task } from "@/lib/firebase/taskService";
import { UserProfile } from "@/lib/firebase/userService";
import { ActivityLogEntry } from "@/lib/firebase/workspaceService";
import toast from "react-hot-toast";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
    console.warn("NEXT_PUBLIC_GEMINI_API_KEY is not set.");
}

const genAI = new GoogleGenerativeAI(apiKey || "dummy_key");

// Smart Hybrid: Pro for deep analysis, Flash as high-quota fallback
const PRO_MODEL = "gemini-2.5-pro";
const FLASH_MODEL = "gemini-2.5-flash";

/**
 * Detect if an error is a 429 rate-limit or quota-exceeded error.
 */
function isRateLimitError(error: unknown): boolean {
    if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        return msg.includes('429') || msg.includes('resource_exhausted') || msg.includes('quota');
    }
    return false;
}

export interface WorkspaceAuditInsight {
    type: 'success' | 'warning' | 'info';
    message: string;
}

export interface SuggestedTaskUpdate {
    taskId: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface WorkspaceAuditResult {
    insights: WorkspaceAuditInsight[];
    chatNudge?: string;
    suggestedTaskUpdates?: SuggestedTaskUpdate[];
}

export const aiAuditorService = {
    /**
     * Analyze workspace state with Pro model, auto-fallback to Flash on 429.
     */
    generateAuditorInsights: async (
        workspaceName: string,
        tasks: Task[],
        members: UserProfile[],
        recentActivity: ActivityLogEntry[]
    ): Promise<WorkspaceAuditResult> => {
        if (!apiKey) throw new Error('Gemini API key is missing');

        const memberList = members.map(m => `- ${m.displayName || 'Unknown'}`).join('\n');
        const taskList = tasks
            .filter(t => t.status !== 'completed')
            .map(t => {
                const assignee = members.find(m => m.userId === t.assigneeId)?.displayName || 'Unassigned';
                const due = t.dueDate ? new Date(t.dueDate.seconds * 1000).toLocaleDateString() : 'None';
                return `- [${t.status}] ${t.title} | P:${t.priority} | @${assignee} | Due:${due}`;
            }).join('\n');
        const activityList = recentActivity.slice(0, 10).map(a =>
            `- ${a.actorName || a.actorId} ${a.action} ${a.targetName || ''}`
        ).join('\n');

        const prompt = `You are "Antigravity Auditor", an AI specializing in Hospital Hygiene auditing. Analyze workspace "${workspaceName}":

Members (${members.length}):
${memberList}

Tasks (${tasks.length}):
${taskList}

Recent Activity (last ${Math.min(recentActivity.length, 10)}):
${activityList}

Analyze: load balancing, overdue risks, completion velocity, unassigned work.
Return JSON per schema. Be concise and actionable.`;

        const responseSchema: Schema = {
            type: SchemaType.OBJECT,
            properties: {
                insights: {
                    type: SchemaType.ARRAY,
                    description: "2-3 actionable bullet points.",
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            type: {
                                type: SchemaType.STRING,
                                description: "'success', 'warning', or 'info'.",
                            },
                            message: {
                                type: SchemaType.STRING,
                                description: "Concise actionable text.",
                            }
                        },
                        required: ["type", "message"]
                    }
                },
                chatNudge: {
                    type: SchemaType.STRING,
                    description: "Optional team chat message for major blockers. Empty string if none.",
                },
                suggestedTaskUpdates: {
                    type: SchemaType.ARRAY,
                    description: "Specific tasks to update based on insights (e.g. increase priority). Optional.",
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            taskId: { type: SchemaType.STRING, description: "The exact task id from the list" },
                            priority: { type: SchemaType.STRING, description: "low, medium, high, or urgent" }
                        },
                        required: ["taskId"]
                    }
                }
            },
            required: ["insights"]
        };

        const generationConfig = {
            responseMimeType: "application/json" as const,
            responseSchema: responseSchema,
            temperature: 0.2,
        };

        const contents = [{ role: 'user' as const, parts: [{ text: prompt }] }];

        // Attempt 1: Pro model (deep reasoning)
        try {
            const proModel = genAI.getGenerativeModel({ model: PRO_MODEL });
            const result = await proModel.generateContent({ contents, generationConfig });
            return JSON.parse(result.response.text()) as WorkspaceAuditResult;
        } catch (proError) {
            if (isRateLimitError(proError)) {
                console.warn('[AI Auditor] Pro model rate-limited (429). Falling back to Flash...');
                toast('⚡ Using Flash auditor for speed — Pro quota reached.', {
                    icon: '🔄',
                    id: 'ai-fallback-toast',
                    duration: 4000,
                });
            } else {
                // Non-429 error from Pro — still try Flash as resilience layer
                console.error('[AI Auditor] Pro model error:', proError);
                toast.error('Pro auditor unavailable. Retrying with Flash...', {
                    id: 'ai-fallback-toast',
                    duration: 3000,
                });
            }
        }

        // Attempt 2: Flash fallback (always available, high quota)
        const flashModel = genAI.getGenerativeModel({ model: FLASH_MODEL });
        const result = await flashModel.generateContent({ contents, generationConfig });
        return JSON.parse(result.response.text()) as WorkspaceAuditResult;
    },

    /**
     * Magic Task Enrichment: Recommend Assignee and expand Description.
     * Uses Flash for speed + high quota.
     */
    enrichTask: async (
        title: string,
        existingDescription: string,
        members: UserProfile[],
        tasksHistory: Task[]
    ) => {
        if (!apiKey) throw new Error('Gemini API key is missing');

        const memberContext = members.map(m => {
            const recent = tasksHistory.filter(t => t.assigneeId === m.userId).map(t => t.title).slice(0, 3);
            return `- ${m.displayName || m.userId}: [${recent.join(', ')}]`;
        }).join('\n');

        const prompt = `New task: "${title}" (current description: "${existingDescription}")

Expand with a professional markdown description and recommend the best assignee.

Members & typical work:
${memberContext}

Return JSON per schema.`;

        const responseSchema: Schema = {
            type: SchemaType.OBJECT,
            properties: {
                suggestedDescription: {
                    type: SchemaType.STRING,
                    description: "Expanded markdown description with outcomes.",
                },
                recommendedAssigneeId: {
                    type: SchemaType.STRING,
                    description: "userId of best assignee, or empty if uncertain.",
                }
            },
            required: ["suggestedDescription"]
        };

        // Use Flash for enrichment — fast, high quota
        const flashModel = genAI.getGenerativeModel({ model: FLASH_MODEL });
        const result = await flashModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.4,
            }
        });

        return JSON.parse(result.response.text()) as {
            suggestedDescription: string;
            recommendedAssigneeId: string | null;
        };
    }
};
