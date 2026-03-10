"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { chatService, ChatMessage, TypingUser } from '@/lib/firebase/chatService';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageCircle } from 'lucide-react';

function formatTimestamp(ts: number): string {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface ChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
    const { user } = useAuthStore();
    const { activeWorkspaceId } = useWorkspaceStore();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Subscribe to messages
    useEffect(() => {
        if (!activeWorkspaceId || !isOpen) return;

        const unsub = chatService.subscribeToMessages(activeWorkspaceId, (msgs) => {
            setMessages(msgs);
        });

        return () => unsub();
    }, [activeWorkspaceId, isOpen]);

    // Subscribe to typing indicators
    useEffect(() => {
        if (!activeWorkspaceId || !user || !isOpen) return;

        const unsub = chatService.subscribeToTyping(activeWorkspaceId, user.uid, (users) => {
            setTypingUsers(users);
        });

        return () => unsub();
    }, [activeWorkspaceId, user, isOpen]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingUsers]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    // Handle typing status
    const handleInputChange = useCallback((value: string) => {
        setInput(value);

        if (!activeWorkspaceId || !user) return;

        // Set typing = true
        chatService.setTypingStatus(activeWorkspaceId, user.uid, user.displayName || 'User', true);

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Stop typing after 2s of no input
        typingTimeoutRef.current = setTimeout(() => {
            if (activeWorkspaceId && user) {
                chatService.setTypingStatus(activeWorkspaceId, user.uid, user.displayName || 'User', false);
            }
        }, 2000);
    }, [activeWorkspaceId, user]);

    const handleSend = async () => {
        if (!input.trim() || !user || !activeWorkspaceId || isSending) return;

        const text = input.trim();
        setInput('');
        setIsSending(true);

        // Stop typing indicator
        chatService.setTypingStatus(activeWorkspaceId, user.uid, user.displayName || 'User', false);

        try {
            await chatService.sendMessage(activeWorkspaceId, {
                senderId: user.uid,
                senderName: user.displayName || 'User',
                senderPhoto: user.photoURL,
                text,
            });
        } catch (err) {
            console.error('[Chat] Failed to send:', err);
            setInput(text); // Restore on failure
        } finally {
            setIsSending(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Cleanup typing on unmount
    useEffect(() => {
        return () => {
            if (activeWorkspaceId && user) {
                chatService.setTypingStatus(activeWorkspaceId, user.uid, user.displayName || 'User', false);
            }
        };
    }, [activeWorkspaceId, user]);

    // Group consecutive messages from the same sender
    const isConsecutive = (index: number) => {
        if (index === 0) return false;
        return messages[index].senderId === messages[index - 1].senderId;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                    className="fixed right-0 top-0 bottom-0 w-full sm:w-[380px] z-40 flex flex-col bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                                <MessageCircle size={16} className="text-white" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-sm text-zinc-900 dark:text-white">Team Chat</h2>
                                <p className="text-[10px] text-zinc-500">{messages.length} messages</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center mb-3">
                                    <MessageCircle size={28} className="text-indigo-500 opacity-60" />
                                </div>
                                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No messages yet</p>
                                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Start the conversation!</p>
                            </div>
                        )}

                        {messages.map((msg, i) => {
                            const isOwn = msg.senderId === user?.uid;
                            const consecutive = isConsecutive(i);

                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${consecutive ? 'mt-0.5' : 'mt-3'}`}
                                >
                                    <div className={`flex items-end gap-2 max-w-[85%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                                        {/* Avatar (only show for first message in group) */}
                                        {!consecutive ? (
                                            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center overflow-hidden shrink-0 mb-0.5">
                                                {msg.senderPhoto ? (
                                                    <img src={msg.senderPhoto} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                                                        {msg.senderName?.charAt(0).toUpperCase() || 'U'}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="w-7 shrink-0" /> /* spacer */
                                        )}

                                        <div>
                                            {/* Name + time (only first in group) */}
                                            {!consecutive && (
                                                <div className={`flex items-center gap-2 mb-0.5 ${isOwn ? 'justify-end' : ''}`}>
                                                    <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                                                        {isOwn ? 'You' : msg.senderName}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                                        {formatTimestamp(msg.timestamp)}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Bubble */}
                                            <div
                                                className={`px-3 py-1.5 rounded-2xl text-sm leading-relaxed break-words ${isOwn
                                                        ? 'bg-indigo-600 text-white rounded-br-md'
                                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-md'
                                                    }`}
                                            >
                                                {msg.text}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* Typing indicator */}
                        <AnimatePresence>
                            {typingUsers.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2 mt-2 px-1"
                                >
                                    <div className="flex gap-0.5 items-center">
                                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                                        {typingUsers.map(u => u.displayName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="px-3 py-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => handleInputChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                className="flex-1 py-2 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
                                disabled={isSending}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isSending}
                                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white transition-colors disabled:cursor-not-allowed shrink-0"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/**
 * Floating chat toggle button for the MainLayout.
 */
export function ChatToggleButton({ onClick, hasUnread }: { onClick: () => void; hasUnread?: boolean }) {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
            title="Open Team Chat"
        >
            <MessageCircle size={22} />
            {hasUnread && (
                <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950 animate-pulse" />
            )}
        </motion.button>
    );
}
