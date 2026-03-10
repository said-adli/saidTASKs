"use client";

import { useState } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export function WorkspaceMembers() {
    const { workspaces, activeWorkspaceId, memberProfiles } = useWorkspaceStore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
    const members = Object.values(memberProfiles);

    if (!activeWorkspace || members.length === 0) return null;

    // Show up to 3 avatars, plus a "+X" indicator
    const DISPLAY_LIMIT = 3;
    const visibleMembers = members.slice(0, DISPLAY_LIMIT);
    const hiddenCount = members.length - DISPLAY_LIMIT;

    return (
        <div className="py-2">
            <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center -space-x-2 hover:space-x-1 transition-all duration-300 ease-in-out cursor-pointer p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                title="View Workspace Members"
            >
                <AnimatePresence>
                    {visibleMembers.map((member, i) => (
                        <motion.div
                            key={member.userId}
                            initial={{ opacity: 0, scale: 0.8, x: -10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ delay: i * 0.1 }}
                            className="relative w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center overflow-hidden shrink-0 z-10 shadow-sm"
                            style={{ zIndex: 10 - i }}
                        >
                            {member.photoURL ? (
                                <img src={member.photoURL} alt={member.displayName || 'User'} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                    {member.displayName ? member.displayName.charAt(0).toUpperCase() : 'U'}
                                </span>
                            )}
                            {/* Presence Dot */}
                            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 ${member.isOnline ? 'bg-green-500' : 'bg-zinc-400'}`} />
                        </motion.div>
                    ))}
                    {hiddenCount > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 z-0 shadow-sm"
                        >
                            <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                                +{hiddenCount}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </button>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Workspace Members</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        {members.map(member => (
                            <div key={member.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                <div className="relative w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center overflow-hidden shrink-0">
                                    {member.photoURL ? (
                                        <img src={member.photoURL} alt={member.displayName || 'User'} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                                            {member.displayName ? member.displayName.charAt(0).toUpperCase() : 'U'}
                                        </span>
                                    )}
                                    {/* Presence Dot */}
                                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${member.isOnline ? 'bg-green-500' : 'bg-zinc-400'}`} />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="font-semibold text-sm">
                                        {member.displayName || 'Anonymous User'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {activeWorkspace.ownerId === member.userId && (
                                            <span className="text-xs text-indigo-500 font-medium">Owner</span>
                                        )}
                                        <span className={`text-xs ${member.isOnline ? 'text-green-600 dark:text-green-400' : 'text-zinc-400'}`}>
                                            {member.isOnline ? '● Online' : '○ Offline'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

