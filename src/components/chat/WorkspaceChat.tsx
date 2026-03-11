"use client";

import { useEffect, useSyncExternalStore } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import { workspaceChatStore } from '@/store/workspaceChatStore';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { Hash, Users, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function WorkspaceChat() {
    const { activeWorkspaceId, workspaces } = useWorkspaceStore();
    const { user, profile } = useAuthStore();
    
    // Subscribe to the high-performance chat store
    const chatState = useSyncExternalStore(
        (cb) => workspaceChatStore.subscribe(cb),
        () => workspaceChatStore.getSnapshot(),
        () => workspaceChatStore.getSnapshot() // Next.js SSR support
    );

    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

    useEffect(() => {
        if (activeWorkspaceId && user) {
            workspaceChatStore.connect(activeWorkspaceId, user.uid);
        } else {
            workspaceChatStore.disconnect();
        }

        // Cleanup on unmount
        return () => {
            workspaceChatStore.disconnect();
        };
    }, [activeWorkspaceId, user]);

    if (!user || !profile) return null;

    if (!activeWorkspaceId || !activeWorkspace) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500 bg-zinc-50 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800">
                <Hash className="w-12 h-12 mb-4 text-zinc-300 dark:text-zinc-700" />
                <h2 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">Select a Workspace</h2>
                <p>Choose a workspace from the sidebar to join the chat.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex items-stretch h-full overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/50 relative">
            
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50">
                
                {/* Header */}
                <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/30">
                            <Hash className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                                {activeWorkspace.name} Chat
                            </h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5 mt-0.5">
                                <Users className="w-3.5 h-3.5" />
                                {chatState.status === 'connecting' ? 'Connecting...' : 'Connected'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status Handling */}
                {chatState.status === 'connecting' && chatState.messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                ) : chatState.status === 'error' ? (
                    <div className="flex-1 flex items-center justify-center text-red-500 flex-col gap-2">
                        <p>Failed to connect to chat room.</p>
                        <p className="text-sm opacity-80">{chatState.error}</p>
                    </div>
                ) : (
                    <>
                        {/* Messages Area */}
                        <ChatMessageList 
                            messages={chatState.messages} 
                            currentUserId={user.uid} 
                        />

                        {/* Typing Indicator Footer */}
                        <AnimatePresence>
                            {chatState.typingUsers.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: 10, height: 0 }}
                                    className="px-6 py-1 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2"
                                >
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <span>
                                        {chatState.typingUsers.map(u => u.displayName).join(', ')} 
                                        {chatState.typingUsers.length > 1 ? ' are' : ' is'} typing...
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input Area */}
                        <ChatInput 
                            workspaceId={activeWorkspaceId!} 
                            userId={user.uid}
                            userName={user.displayName || 'Anonymous'}
                            userPhoto={user.photoURL}
                        />
                    </>
                )}
            </div>

        </div>
    );
}
