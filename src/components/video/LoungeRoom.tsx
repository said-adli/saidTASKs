"use client";

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, Mic, MicOff, Video, VideoOff, X, PhoneMissed } from 'lucide-react';

interface LoungeRoomProps {
    workspaceId: string;
    workspaceName: string;
    isOpen: boolean;
    onClose: () => void;
}

export function LoungeRoom({ workspaceId, workspaceName, isOpen, onClose }: LoungeRoomProps) {
    const { user } = useAuthStore();
    const jitsiContainerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<any>(null);

    const [isLoaded, setIsLoaded] = useState(false);
    const [isPiP, setIsPiP] = useState(true);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);

    // Dynamic Script Loading & Jitsi Initialization
    useEffect(() => {
        if (!isOpen || !user || !workspaceId) return;

        // Cleanup previous instance if any
        if (apiRef.current) {
            apiRef.current.dispose();
            apiRef.current = null;
        }

        const loadScript = () => {
            return new Promise((resolve, reject) => {
                if (window.JitsiMeetExternalAPI) {
                    resolve(window.JitsiMeetExternalAPI);
                    return;
                }
                const script = document.createElement('script');
                script.src = 'https://meet.jit.si/external_api.js';
                script.async = true;
                script.onload = () => resolve(window.JitsiMeetExternalAPI);
                script.onerror = reject;
                document.body.appendChild(script);
            });
        };

        const initJitsi = async () => {
            try {
                const JitsiMeetExternalAPI = await loadScript() as any;

                // Hash generating a unique, safe room name
                const safeName = workspaceName.replace(/[^a-zA-Z0-9]/g, '');
                const roomName = `saidTASKs_Lounge_${safeName}_${workspaceId.substring(0, 10)}`;

                const domain = 'meet.jit.si';
                const options = {
                    roomName,
                    width: '100%',
                    height: '100%',
                    parentNode: jitsiContainerRef.current,
                    configOverwrite: {
                        startWithAudioMuted: false,
                        startWithVideoMuted: false,
                        prejoinPageEnabled: false, // Skip prejoin for seamless entry
                        disableDeepLinking: true,
                        enableNoAudioDetection: false,
                        enableNoisyMicDetection: false,
                    },
                    interfaceConfigOverwrite: {
                        DISABLE_VIDEO_BACKGROUND: true,
                        TOOLBAR_BUTTONS: [
                            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                            'fodeviceselection', 'profile', 'chat', 'recording',
                            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                            'tileview', 'select-background', 'download', 'help', 'mute-everyone', 'security'
                        ],
                        HIDE_INVITE_MORE_HEADER: true,
                    },
                    userInfo: {
                        displayName: user.displayName || 'Team Member',
                        email: user.email || '',
                    }
                };

                const api = new JitsiMeetExternalAPI(domain, options);
                apiRef.current = api;

                api.addEventListener('videoConferenceJoined', () => {
                    setIsLoaded(true);
                });

                api.addEventListener('audioMuteStatusChanged', ({ muted }: { muted: boolean }) => {
                    setIsAudioMuted(muted);
                });

                api.addEventListener('videoMuteStatusChanged', ({ muted }: { muted: boolean }) => {
                    setIsVideoMuted(muted);
                });

                api.addEventListener('readyToClose', () => {
                    handleLeave();
                });

            } catch (err) {
                console.error("Failed to load Jitsi script", err);
            }
        };

        initJitsi();

        return () => {
            if (apiRef.current) {
                apiRef.current.dispose();
                apiRef.current = null;
                setIsLoaded(false);
            }
        };
    }, [isOpen, workspaceId, user]); // Only re-run if these core deps change

    const handleLeave = () => {
        if (apiRef.current) {
            apiRef.current.dispose();
            apiRef.current = null;
        }
        setIsLoaded(false);
        onClose();
    };

    const toggleAudio = () => {
        if (apiRef.current) {
            apiRef.current.executeCommand('toggleAudio');
        }
    };

    const toggleVideo = () => {
        if (apiRef.current) {
            apiRef.current.executeCommand('toggleVideo');
        }
    };

    if (!isOpen) return null;

    // Mobile logic: always full screen, no PiP
    const isMobile = window.innerWidth <= 768;
    const forceFullScreen = isMobile || !isPiP;

    return (
        <AnimatePresence>
            <motion.div
                initial={isMobile ? { opacity: 0, y: 50 } : { opacity: 0, scale: 0.9, x: 20, y: 20 }}
                animate={forceFullScreen ? {
                    opacity: 1, scale: 1, x: 0, y: 0,
                    right: 0, bottom: 0, top: 0, left: 0,
                    width: '100vw', height: '100vh',
                    borderRadius: 0,
                } : {
                    opacity: 1, scale: 1,
                    bottom: 24, right: 24,
                    width: 320, height: 240,
                    borderRadius: 16,
                }}
                exit={{ opacity: 0, scale: 0.9, y: 50 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                drag={!forceFullScreen}
                dragConstraints={{ top: -500, left: -1000, right: 0, bottom: 0 }}
                dragElastic={0.1}
                dragMomentum={false}
                className={`fixed z-[100] bg-zinc-950 overflow-hidden shadow-2xl flex flex-col ${!forceFullScreen && 'cursor-move ring-1 ring-white/10'}`}
                style={{
                    position: 'fixed'
                }}
            >
                {/* Custom Overlay Controls (Visible mostly in PiP mode) */}
                <div className="absolute top-0 inset-x-0 p-3 h-24 bg-gradient-to-b from-black/80 to-transparent z-10 opacity-0 hover:opacity-100 transition-opacity flex justify-between items-start pointer-events-none">
                    <div className="text-white text-xs font-medium px-2 py-1 bg-black/40 rounded-md backdrop-blur-md pointer-events-auto">
                        Lounge
                    </div>
                    <div className="flex items-center gap-1.5 pointer-events-auto">
                        {!isMobile && (
                            <button
                                onClick={() => setIsPiP(!isPiP)}
                                className="p-1.5 rounded-md hover:bg-white/20 text-white transition-colors"
                            >
                                {isPiP ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                            </button>
                        )}
                        <button
                            onClick={handleLeave}
                            className="p-1.5 rounded-md hover:bg-red-500/80 text-white transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-0">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-medium text-white">Connecting to Lounge...</p>
                        </div>
                    </div>
                )}

                {/* The Jitsi Iframe Container */}
                <div ref={jitsiContainerRef} className="w-full h-full flex-1" />

                {/* Bottom Overlay Controls (PiP Mode Only) */}
                {isPiP && !isMobile && (
                    <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent z-10 flex justify-center gap-3 opacity-0 hover:opacity-100 transition-opacity">
                        <button
                            onClick={toggleAudio}
                            className={`p-2.5 rounded-full transition-colors shadow-lg ${isAudioMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}
                        >
                            {isAudioMuted ? <MicOff size={16} /> : <Mic size={16} />}
                        </button>
                        <button
                            onClick={toggleVideo}
                            className={`p-2.5 rounded-full transition-colors shadow-lg ${isVideoMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}
                        >
                            {isVideoMuted ? <VideoOff size={16} /> : <Video size={16} />}
                        </button>
                        <button
                            onClick={handleLeave}
                            className="p-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg"
                        >
                            <PhoneMissed size={16} />
                        </button>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}

// Global TypeScript declaration for Jitsi API
declare global {
    interface Window {
        JitsiMeetExternalAPI: any;
    }
}
