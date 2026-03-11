"use client";

import { useState } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/useProjectStore';
import { workspaceService } from '@/lib/firebase/workspaceService';
import { LogOut, Trash2, Loader2, UserMinus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export function WorkspaceMembers() {
    const { workspaces, activeWorkspaceId, memberProfiles, setActiveWorkspaceId } = useWorkspaceStore();
    const { user } = useAuthStore();
    const { setActiveProjectId } = useProjectStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [removingUserId, setRemovingUserId] = useState<string | null>(null);

    const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
    const members = Object.values(memberProfiles);

    if (!activeWorkspace || members.length === 0) return null;

    // Show up to 3 avatars, plus a "+X" indicator
    const DISPLAY_LIMIT = 3;
    const visibleMembers = members.slice(0, DISPLAY_LIMIT);
    const hiddenCount = members.length - DISPLAY_LIMIT;

    const handleLeaveWorkspace = async () => {
        if (!user || !activeWorkspaceId) return;
        if (!confirm("Are you sure you want to leave this workspace?")) return;
        try {
            setIsLeaving(true);
            await workspaceService.removeMember(activeWorkspaceId, user.uid);
            setActiveWorkspaceId('');
            setActiveProjectId('inbox');
            setIsModalOpen(false);
            toast.success("Left workspace successfully.");
        } catch (error) {
            console.error("Failed to leave:", error);
            toast.error("Failed to leave workspace.");
        } finally {
            setIsLeaving(false);
        }
    };

    const handleDeleteWorkspace = async () => {
        if (!user || !activeWorkspaceId) return;
        if (!confirm("Are you sure you want to completely delete this workspace? This cannot be undone!")) return;
        try {
            setIsLeaving(true);
            await workspaceService.deleteWorkspace(activeWorkspaceId);
            setActiveWorkspaceId('');
            setActiveProjectId('inbox');
            setIsModalOpen(false);
            toast.success("Workspace deleted.");
        } catch (error) {
            console.error("Failed to delete:", error);
            toast.error("Failed to delete workspace.");
        } finally {
            setIsLeaving(false);
        }
    };

    const handleKickMember = async (memberId: string) => {
        if (!user || !activeWorkspaceId || memberId === user.uid) return;
        if (!confirm("Are you sure you want to kick this member from the workspace?")) return;
        
        try {
            setRemovingUserId(memberId);
            await workspaceService.removeMember(activeWorkspaceId, memberId);
            toast.success("Member removed successfully.");
        } catch (error) {
            console.error("Failed to remove member:", error);
            toast.error("Failed to remove member.");
        } finally {
            setRemovingUserId(null);
        }
    };

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
                                {user && activeWorkspace.ownerId === user.uid && member.userId !== user.uid && (
                                    <button
                                        onClick={() => handleKickMember(member.userId)}
                                        disabled={removingUserId === member.userId}
                                        className="p-2 ml-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50"
                                        title="Kick Member"
                                    >
                                        {removingUserId === member.userId ? <Loader2 size={16} className="animate-spin" /> : <UserMinus size={16} />}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {user && (
                        <div className="pt-4 mt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                            {activeWorkspace.ownerId === user.uid ? (
                                <button
                                    onClick={handleDeleteWorkspace}
                                    disabled={isLeaving}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isLeaving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    Delete Workspace
                                </button>
                            ) : (
                                <button
                                    onClick={handleLeaveWorkspace}
                                    disabled={isLeaving}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isLeaving ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                                    Leave Workspace
                                </button>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

