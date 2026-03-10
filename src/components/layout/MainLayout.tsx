"use client";

import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { ChatPanel, ChatToggleButton } from '@/components/chat/ChatPanel';
import { LoungeRoom } from '@/components/video/LoungeRoom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Loader2 } from 'lucide-react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const { user, loading: authLoading } = useAuthStore();
    const { workspaces, activeWorkspaceId, isLoungeOpen, setIsLoungeOpen, loading: workspaceLoading } = useWorkspaceStore();

    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

    // Auth is still initializing — render a bare container so the Splash Screen
    // from page.tsx appears without any Dashboard chrome (Sidebar/Navbar).
    if (authLoading) {
        return (
            <div className="flex flex-col min-h-screen w-full bg-slate-950 text-white overflow-x-hidden">
                {children}
            </div>
        );
    }

    // Non-logged-in users get a clean full-width canvas (for landing page)
    if (!user) {
        return (
            <div className="flex flex-col min-h-screen w-full bg-slate-950 text-white overflow-x-hidden">
                {children}
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full bg-white dark:bg-zinc-950 relative">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex h-screen sticky top-0 shrink-0">
                <Sidebar />
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                            className="fixed inset-y-0 left-0 z-50 w-64 md:hidden shadow-2xl"
                        >
                            <Sidebar onNavItemClick={() => setIsMobileMenuOpen(false)} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <CommandPalette />

            <div className="flex flex-col flex-1 min-w-0">
                <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
                <main className="flex-1 overflow-y-auto p-6 text-zinc-900 dark:text-zinc-100 relative">
                    <AnimatePresence mode="wait">
                        {workspaceLoading ? (
                            <motion.div
                                key="loader"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm"
                            >
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                    <p className="text-sm font-medium text-zinc-500 animate-pulse">Switching Workspace...</p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="content"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                            >
                                {children}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            {/* Chat System */}
            <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
            {!isChatOpen && <ChatToggleButton onClick={() => setIsChatOpen(true)} />}

            {/* Chat backdrop on mobile */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsChatOpen(false)}
                        className="fixed inset-0 bg-black/30 z-30 sm:hidden backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Video Lounge */}
            <LoungeRoom
                workspaceId={activeWorkspaceId || ''}
                workspaceName={activeWorkspace?.name || 'Workspace'}
                isOpen={isLoungeOpen}
                onClose={() => setIsLoungeOpen(false)}
            />
        </div>
    );
}
