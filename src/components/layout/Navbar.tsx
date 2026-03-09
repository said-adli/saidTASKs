"use client";
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { Search, Moon, Sun, LogIn, LogOut, Menu } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
    const { setCmdKOpen } = useUIStore();
    const { user, loginWithGoogle, logout, loading } = useAuthStore();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => setMounted(true), []);

    return (
        <nav className="h-16 border-b flex items-center justify-between px-4 sm:px-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <div className="flex-1 max-w-xl flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 -ml-2 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    <Menu size={20} />
                </button>
                <button
                    onClick={() => setCmdKOpen(true)}
                    className="flex items-center gap-2 w-full max-w-sm px-4 py-2 text-sm text-zinc-500 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 rounded-md border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                >
                    <Search size={16} />
                    <span className="hidden sm:inline">Search or jump to...</span>
                    <span className="sm:hidden">Search...</span>
                    <span className="hidden sm:inline ml-auto text-xs border border-zinc-300 dark:border-zinc-600 rounded px-1.5 py-0.5">Ctrl+K</span>
                </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                {loading ? (
                    <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                ) : user ? (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            {user.photoURL && (
                                <Image
                                    src={user.photoURL}
                                    alt={user.displayName || "User profile"}
                                    width={32}
                                    height={32}
                                    className="rounded-full border border-zinc-200 dark:border-zinc-700"
                                />
                            )}
                        </div>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 rounded-md transition-colors"
                        >
                            <LogOut size={16} />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={loginWithGoogle}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-sm"
                    >
                        <LogIn size={16} />
                        <span>Login with Google</span>
                    </button>
                )}

                {mounted && (
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-300 relative w-10 h-10 flex items-center justify-center overflow-hidden"
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={theme === 'dark' ? 'dark' : 'light'}
                                initial={{ y: -20, opacity: 0, rotate: -45 }}
                                animate={{ y: 0, opacity: 1, rotate: 0 }}
                                exit={{ y: 20, opacity: 0, rotate: 45 }}
                                transition={{ duration: 0.2 }}
                            >
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </motion.div>
                        </AnimatePresence>
                    </button>
                )}
            </div>
        </nav>
    );
}
