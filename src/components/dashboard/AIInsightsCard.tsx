"use client";

import { useEffect, useState } from 'react';
import { aiAuditorService, WorkspaceAuditInsight } from '@/lib/gemini/aiAuditorService';
import { useTaskStore } from '@/store/useTaskStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { activityLogService } from '@/lib/firebase/workspaceService';
import { chatService } from '@/lib/firebase/chatService';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertTriangle, Info, CheckCircle2, RefreshCw } from 'lucide-react';

export function AIInsightsCard() {
    const { activeWorkspaceId, memberProfiles, workspaces } = useWorkspaceStore();
    const { tasks } = useTaskStore();

    const [insights, setInsights] = useState<WorkspaceAuditInsight[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

    const generateInsights = async (isManual = false) => {
        if (!activeWorkspaceId || !activeWorkspace) return;
        setIsLoading(true);
        setError(null);

        try {
            // Get recent activity
            const recentActivity = await activityLogService.getRecentLogs(activeWorkspaceId, 20);

            // Get members as array
            const membersList = Object.values(memberProfiles);

            const result = await aiAuditorService.generateAuditorInsights(
                activeWorkspace.name,
                tasks,
                membersList,
                recentActivity
            );

            setInsights(result.insights);
            setLastUpdated(new Date());

            // If there's a chat nudge, send it to the chat as a system message
            if (result.chatNudge) {
                // Determine sender as AI Auditor
                await chatService.sendMessage(activeWorkspaceId, {
                    senderId: 'SYSTEM_AI',
                    senderName: '🤖 AI Auditor',
                    senderPhoto: null,
                    text: result.chatNudge
                });
            }

        } catch (err: any) {
            console.error("Failed to generate insights:", err);
            setError(err.message || "Failed to analyze workspace.");
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-fetch on workspace change, but only once
    useEffect(() => {
        if (activeWorkspaceId && tasks.length > 0 && insights.length === 0 && !isLoading) {
            generateInsights();
        }
    }, [activeWorkspaceId, tasks.length]); // Intentionally omitting insights.length to prevent loops

    const renderIcon = (type: string) => {
        switch (type) {
            case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
            case 'success': return <CheckCircle2 size={16} className="text-emerald-500" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    if (!activeWorkspaceId) return null;

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4 shadow-sm relative overflow-hidden group">
            {/* Background embellishment */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-transform group-hover:scale-110 group-hover:rotate-12 duration-700">
                <Sparkles size={120} />
            </div>

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                        <Sparkles size={16} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                            AI Workspace Auditor
                        </h3>
                        {lastUpdated && (
                            <p className="text-[10px] text-zinc-500 font-medium">
                                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => generateInsights(true)}
                    disabled={isLoading}
                    className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 rounded-md transition-colors disabled:opacity-50"
                    title="Refresh Insights"
                >
                    <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                </button>
            </div>

            <div className="relative z-10 min-h-[60px]">
                {isLoading && insights.length === 0 ? (
                    <div className="flex items-center gap-3 text-sm text-indigo-600/80 dark:text-indigo-400/80 font-medium animate-pulse py-2">
                        <Sparkles size={16} className="animate-spin-slow" />
                        Analyzing workspace health and capacity...
                    </div>
                ) : error ? (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-lg flex items-start gap-2">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                ) : insights.length === 0 ? (
                    <div className="text-sm text-zinc-500 italic py-2">
                        Click refresh to analyze the workspace.
                    </div>
                ) : (
                    <ul className="space-y-2.5">
                        <AnimatePresence>
                            {insights.map((insight, idx) => (
                                <motion.li
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-start gap-2.5 text-sm"
                                >
                                    <div className="mt-0.5 shrink-0 bg-white dark:bg-zinc-900 rounded-full p-0.5 shadow-sm">
                                        {renderIcon(insight.type)}
                                    </div>
                                    <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                                        {insight.message}
                                    </span>
                                </motion.li>
                            ))}
                        </AnimatePresence>
                    </ul>
                )}
            </div>
        </div>
    );
}
