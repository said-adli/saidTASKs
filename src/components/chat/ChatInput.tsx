"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import { chatService } from '@/lib/firebase/chatService';

interface ChatInputProps {
    workspaceId: string;
    userId: string;
    userName: string;
    userPhoto: string | null;
}

export function ChatInput({ workspaceId, userId, userName, userPhoto }: ChatInputProps) {
    const [text, setText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Update typing status via RTDB
    const updateTypingStatus = useCallback((isTyping: boolean) => {
        if (!workspaceId || !userId) return;
        chatService.setTypingStatus(workspaceId, userId, userName, isTyping);
    }, [workspaceId, userId, userName]);

    // Handle text change and throttle typing indicator
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);

        if (e.target.value.trim().length > 0) {
            updateTypingStatus(true);
            
            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            
            // Set new timeout to clear typing status after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                updateTypingStatus(false);
            }, 2000);
        } else {
            updateTypingStatus(false);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        }
    };

    // Auto-cleanup typing status on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (workspaceId && userId) {
                chatService.setTypingStatus(workspaceId, userId, userName, false);
            }
        };
    }, [workspaceId, userId, userName]);

    const handleSend = async () => {
        const trimmed = text.trim();
        if (!trimmed || !workspaceId || !userId) return;

        setIsSending(true);
        setText('');
        updateTypingStatus(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        // Auto-resize reset
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
        }

        try {
            await chatService.sendMessage(workspaceId, {
                senderId: userId,
                senderName: userName,
                senderPhoto: userPhoto,
                text: trimmed
            });
        } catch (error) {
            console.error("Error sending message:", error);
            // Optionally could restore text here if send failed
            setText(trimmed);
        } finally {
            setIsSending(false);
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
            <div className="relative flex items-end gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all shadow-sm">
                <textarea
                    ref={inputRef}
                    value={text}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 max-h-32 min-h-[40px] bg-transparent outline-none resize-none py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 custom-scrollbar"
                    // Simple auto-resize trick
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                    }}
                />
                
                <button
                    onClick={handleSend}
                    disabled={!text.trim() || isSending}
                    className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white transition-colors mb-0.5 shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:shadow-none"
                    aria-label="Send message"
                >
                    <Send size={18} className={text.trim() && !isSending ? "ml-1" : ""} />
                </button>
            </div>
            <div className="flex justify-between mt-2 px-2">
                <span className="text-[10px] text-zinc-400 font-medium">
                    Shift + Enter translates to a new line
                </span>
            </div>
        </div>
    );
}
