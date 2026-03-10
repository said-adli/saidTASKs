"use client";

import { useEffect, useState } from 'react';
import { ActivityLogEntry, activityLogService } from '@/lib/firebase/workspaceService';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, CheckCircle2, UserPlus, ClipboardList, UserCheck } from 'lucide-react';

const ACTION_CONFIG: Record<string, { icon: typeof Activity; color: string; label: string }> = {
    'task.created': { icon: ClipboardList, color: 'text-blue-500', label: 'created a task' },
    'task.completed': { icon: CheckCircle2, color: 'text-green-500', label: 'completed' },
    'task.assigned': { icon: UserCheck, color: 'text-indigo-500', label: 'assigned' },
    'member.joined': { icon: UserPlus, color: 'text-amber-500', label: 'joined the workspace' },
};

function timeAgo(timestamp: any): string {
    if (!timestamp) return 'just now';
    const seconds = timestamp.seconds || timestamp._seconds || 0;
    const diff = Math.floor(Date.now() / 1000 - seconds);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export function ActivityFeed() {
    const { activeWorkspaceId, memberProfiles } = useWorkspaceStore();
    const [entries, setEntries] = useState<ActivityLogEntry[]>([]);

    useEffect(() => {
        if (!activeWorkspaceId) return;

        const unsub = activityLogService.subscribe(activeWorkspaceId, (logs) => {
            setEntries(logs);
        });

        return () => unsub();
    }, [activeWorkspaceId]);

    if (entries.length === 0) {
        return (
            <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                <Activity className="mx-auto mb-2 opacity-50" size={20} />
                No activity yet
            </div>
        );
    }

    return (
        <div className="space-y-1 max-h-[300px] overflow-y-auto px-1">
            <AnimatePresence initial={false}>
                {entries.map((entry, i) => {
                    const config = ACTION_CONFIG[entry.action] || ACTION_CONFIG['task.created'];
                    const Icon = config.icon;
                    const actor = memberProfiles[entry.actorId];
                    const actorName = entry.actorName || actor?.displayName || 'Someone';

                    return (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-start gap-2.5 py-2 px-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                        >
                            <div className={`mt-0.5 shrink-0 ${config.color}`}>
                                <Icon size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                    <span className="font-semibold">{actorName}</span>
                                    {' '}{config.label}
                                    {entry.targetName && (
                                        <span className="font-medium text-zinc-900 dark:text-zinc-100"> &quot;{entry.targetName}&quot;</span>
                                    )}
                                    {entry.assigneeName && (
                                        <span> to <span className="font-medium">{entry.assigneeName}</span></span>
                                    )}
                                </p>
                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                    {timeAgo(entry.timestamp)}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
