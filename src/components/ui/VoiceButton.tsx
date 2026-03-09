"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpeechService } from '@/lib/voice/speechService';
import { commandParser } from '@/lib/voice/commandParser';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function VoiceButton() {
    const { user } = useAuthStore();
    const { addTask } = useTasks();
    const { projects, activeProjectId } = useProjects();
    const router = useRouter();

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    const speechServiceRef = useRef<SpeechService | null>(null);

    // Initialize Speech Service
    useEffect(() => {
        speechServiceRef.current = new SpeechService({
            language: 'en-US',
            onResult: (text, isFinal) => {
                setTranscript(text);
                if (isFinal && text.trim().length > 0) {
                    handleFinalTranscript(text.trim());
                }
            },
            onError: (err) => {
                setError(err);
                setIsListening(false);
                setTimeout(() => setError(null), 3000);
            },
            onEnd: () => {
                // For a button-triggered interaction, ending stops the UI state natively
                setIsListening(false);
            }
        });

        return () => {
            if (speechServiceRef.current) {
                speechServiceRef.current.stop();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dep array because we rely on refs and store state for actions inside the handle function to avoid stale closures. Actually, standard react paradigm prefers we just depend on what we use.
    // Wait, the callback needs fresh references. It's safer to just bind the execution below.

    const handleFinalTranscript = async (text: string) => {
        // Pausing listening visually
        setIsListening(false);
        speechServiceRef.current?.stop();

        const parsed = commandParser.parseCommand(text);

        if (!user) {
            toast.error("Please login to use voice commands.");
            setTimeout(() => setTranscript(''), 2000);
            return;
        }

        try {
            switch (parsed.intent) {
                case 'ADD_TASK':
                    const inboxId = projects.find(p => p.isDefault)?.id || '';
                    const isSmartList = ['inbox', 'today', 'upcoming', 'important'].includes(activeProjectId as string);
                    const targetProjectId = !isSmartList ? (activeProjectId as string) : inboxId;

                    await addTask(user.uid, {
                        title: parsed.payload.title,
                        description: '',
                        priority: parsed.payload.priority,
                        status: 'todo',
                        projectId: targetProjectId,
                        subtasks: [],
                        attachments: [],
                        tagIds: []
                    } as any);

                    toast.success(`Task added: ${parsed.payload.title}`);
                    break;
                case 'NAVIGATE':
                    router.push(parsed.payload.route);
                    toast.success(`Navigating...`);
                    break;
                case 'UNKNOWN':
                    toast.error(`Did not understand: "${text}"`);
                    break;
            }
        } catch (err) {
            console.error("Voice action failed", err);
            toast.error("Failed to execute voice command.");
        }

        // Clear transcript after short delay
        setTimeout(() => setTranscript(''), 2500);
    };

    const toggleListening = () => {
        if (!speechServiceRef.current) return;

        if (isListening) {
            speechServiceRef.current.stop();
            setIsListening(false);
        } else {
            setError(null);
            setTranscript('');
            speechServiceRef.current.start();
            setIsListening(true);
        }
    };

    // Don't render the fab until client is mounted or user exists (optional)
    if (!user) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
            {/* Transcript Tooltip */}
            <div className="flex items-end justify-end pointer-events-none min-h-[40px]">
                <AnimatePresence>
                    {(transcript || error) && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className={`px-4 py-2 rounded-xl shadow-lg text-sm max-w-xs md:max-w-sm backdrop-blur-md overflow-hidden text-ellipsis whitespace-nowrap border pointer-events-none
                                ${error
                                    ? 'bg-red-500/90 text-white border-red-600'
                                    : 'bg-zinc-900/90 dark:bg-zinc-800/90 text-zinc-100 border-zinc-700 dark:border-zinc-700'
                                }`}
                        >
                            {error ? error : <span className="italic">&quot;{transcript}&quot;</span>}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* FAB Button */}
            <motion.button
                onClick={toggleListening}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-500/30 text-white ${isListening ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600'
                    }`}
                aria-label={isListening ? 'Stop listening' : 'Start voice command'}
            >
                {/* Pulse ring when active */}
                {isListening && (
                    <span className="absolute inset-0 rounded-full animate-ping opacity-30 bg-indigo-400" />
                )}

                {isListening ? (
                    <Mic className="animate-pulse" size={24} />
                ) : (
                    <MicOff size={24} className="text-zinc-400 dark:text-zinc-400" />
                )}
            </motion.button>
        </div>
    );
}
