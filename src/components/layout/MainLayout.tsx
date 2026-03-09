"use client";

import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, loading } = useAuthStore();

    // Non-logged-in users get a clean full-width canvas (for landing page)
    if (!user && !loading) {
        return (
            <div className="flex flex-col min-h-screen w-full bg-slate-950 text-white overflow-x-hidden">
                {children}
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full bg-white dark:bg-zinc-950 overflow-hidden relative">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex h-full">
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
                <main className="flex-1 overflow-auto p-6 text-zinc-900 dark:text-zinc-100">
                    {children}
                </main>
            </div>
        </div>
    );
}

