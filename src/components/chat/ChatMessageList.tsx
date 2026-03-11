"use client";

import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '@/lib/firebase/chatService';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { User } from 'lucide-react';
import { format } from 'date-fns';

interface ChatMessageListProps {
    messages: ChatMessage[];
    currentUserId: string | null;
}

export function ChatMessageList({ messages, currentUserId }: ChatMessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

    // Initial scroll setup and listening to user scroll
    useEffect(() => {
        const handleScroll = () => {
            if (!scrollContainerRef.current) return;
            const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
            // If user scrolls up more than 50px from bottom, disable auto-scroll
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
            setIsAutoScrollEnabled(isNearBottom);
        };

        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });
        }
        return () => {
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    // Auto-scroll when new messages arrive
    useEffect(() => {
        if (isAutoScrollEnabled && bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isAutoScrollEnabled]);

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-4">
                <div className="flex -space-x-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center z-10 border-2 border-white dark:border-zinc-950">
                        <User className="text-zinc-400 w-6 h-6" />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center z-20 border-2 border-white dark:border-zinc-950">
                        <User className="text-indigo-500 dark:text-indigo-400 w-6 h-6" />
                    </div>
                </div>
                <div className="text-center">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">No messages yet</h3>
                    <p className="text-sm">Be the first to say hello!</p>
                </div>
            </div>
        );
    }

    return (
        <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar"
        >
            {messages.map((msg, index) => {
                const isMe = msg.senderId === currentUserId;
                const showHeader = index === 0 || messages[index - 1].senderId !== msg.senderId || (msg.timestamp - messages[index - 1].timestamp > 5 * 60 * 1000); // 5 min gap

                return (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex max-w-[85%] sm:max-w-[75%]",
                            isMe ? "ml-auto justify-end" : "justify-start"
                        )}
                    >
                        {!isMe && showHeader && (
                            <div className="flex-shrink-0 mr-3 mt-0.5">
                                {msg.senderPhoto ? (
                                    <Image
                                        src={msg.senderPhoto}
                                        alt={msg.senderName}
                                        width={32}
                                        height={32}
                                        className="rounded-full shadow-sm ring-2 ring-white dark:ring-zinc-900"
                                    />
                                ) : (
                                    <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 font-bold text-xs ring-2 ring-white dark:ring-zinc-900 shadow-sm">
                                        {msg.senderName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Buffer for messages that don't show the header avatar */}
                        {!isMe && !showHeader && <div className="w-8 mr-3 flex-shrink-0" />}

                        <div className={cn("flex flex-col gap-1", isMe ? "items-end" : "items-start")}>
                            {showHeader && (
                                <div className="flex items-center gap-2 px-1">
                                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                        {isMe ? 'You' : msg.senderName}
                                    </span>
                                    <span className="text-[10px] text-zinc-400">
                                        {msg.timestamp ? format(new Date(msg.timestamp), 'h:mm a') : 'Sending...'}
                                    </span>
                                </div>
                            )}
                            
                            <div
                                className={cn(
                                    "px-4 py-2.5 rounded-2xl text-sm shadow-sm whitespace-pre-wrap break-words",
                                    isMe
                                        ? "bg-indigo-500 text-white rounded-tr-sm"
                                        : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-tl-sm"
                                )}
                            >
                                {msg.text}
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={bottomRef} className="h-2" />
        </div>
    );
}
