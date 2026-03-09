"use client";

import { useEffect, useState, useMemo } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { useTheme } from 'next-themes';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { Search, Monitor, Moon, Sun, LayoutDashboard, KanbanSquare, BarChart3, Folder, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function CommandPalette() {
    const router = useRouter();
    const { isCmdKOpen, setCmdKOpen } = useUIStore();
    const { setTheme } = useTheme();
    const { tasks } = useTasks();
    const { projects, setActiveProjectId } = useProjects();
    const [search, setSearch] = useState('');

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setCmdKOpen(!isCmdKOpen);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [isCmdKOpen, setCmdKOpen]);

    const runCommand = (command: () => void) => {
        setCmdKOpen(false);
        command();
        setSearch('');
    };

    return (
        <AnimatePresence>
            {isCmdKOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setCmdKOpen(false)}
                        className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="relative z-[101] w-full max-w-2xl px-4"
                    >
                        <Command className="w-full flex flex-col overflow-hidden bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800">
                            <div className="flex items-center px-4 border-b border-zinc-200 dark:border-zinc-800" cmdk-input-wrapper="">
                                <Search className="w-5 h-5 text-zinc-500 mr-2 shrink-0" />
                                <Command.Input
                                    autoFocus
                                    placeholder="Search tasks, projects, or commands..."
                                    value={search}
                                    onValueChange={setSearch}
                                    className="flex-1 h-14 bg-transparent outline-none placeholder:text-zinc-500 text-zinc-900 dark:text-zinc-100"
                                />
                            </div>

                            <Command.List className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
                                <Command.Empty className="py-6 text-center text-sm text-zinc-500">
                                    No results found.
                                </Command.Empty>

                                {tasks.length > 0 && (
                                    <Command.Group heading="Active Tasks" className="text-xs font-medium text-zinc-500 p-2">
                                        {tasks.filter(t => t.status !== 'completed').slice(0, 5).map(task => (
                                            <Command.Item
                                                key={task.id}
                                                onSelect={() => runCommand(() => {
                                                    setActiveProjectId(task.projectId!);
                                                    router.push('/');
                                                })}
                                                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-default text-zinc-700 dark:text-zinc-300 aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800/50 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 group"
                                            >
                                                <CheckCircle className="w-4 h-4 text-zinc-400 group-aria-selected:text-indigo-500" />
                                                <span>{task.title}</span>
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}

                                <Command.Group heading="Navigation" className="text-xs font-medium text-zinc-500 p-2">
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push('/'))}
                                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-default text-zinc-700 dark:text-zinc-300 aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800/50 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 group"
                                    >
                                        <LayoutDashboard className="w-4 h-4 text-zinc-400 group-aria-selected:text-indigo-500" />
                                        <span>Dashboard</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push('/board'))}
                                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-default text-zinc-700 dark:text-zinc-300 aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800/50 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 group"
                                    >
                                        <KanbanSquare className="w-4 h-4 text-zinc-400 group-aria-selected:text-indigo-500" />
                                        <span>Kanban Board</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push('/analytics'))}
                                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-default text-zinc-700 dark:text-zinc-300 aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800/50 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 group"
                                    >
                                        <BarChart3 className="w-4 h-4 text-zinc-400 group-aria-selected:text-indigo-500" />
                                        <span>Analytics & Gamification</span>
                                    </Command.Item>
                                </Command.Group>

                                {projects.length > 0 && (
                                    <Command.Group heading="Projects" className="text-xs font-medium text-zinc-500 p-2">
                                        {projects.map(project => (
                                            <Command.Item
                                                key={project.id}
                                                onSelect={() => runCommand(() => {
                                                    setActiveProjectId(project.id);
                                                    router.push('/');
                                                })}
                                                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-default text-zinc-700 dark:text-zinc-300 aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800/50 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 group"
                                            >
                                                <Folder className="w-4 h-4 text-zinc-400 group-aria-selected:text-indigo-500" />
                                                <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: project.color }} />
                                                <span>Go to {project.name}</span>
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}

                                <Command.Separator className="h-px bg-zinc-200 dark:bg-zinc-800 mx-2 my-2" />

                                <Command.Group heading="Theme" className="text-xs font-medium text-zinc-500 p-2">
                                    <Command.Item
                                        onSelect={() => runCommand(() => setTheme('light'))}
                                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-default text-zinc-700 dark:text-zinc-300 aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800/50 aria-selected:text-orange-600 dark:aria-selected:text-orange-400 group"
                                    >
                                        <Sun className="w-4 h-4 text-zinc-400 group-aria-selected:text-orange-500" />
                                        <span>Light Mode</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(() => setTheme('dark'))}
                                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-default text-zinc-700 dark:text-zinc-300 aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800/50 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 group"
                                    >
                                        <Moon className="w-4 h-4 text-zinc-400 group-aria-selected:text-indigo-500" />
                                        <span>Dark Mode</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(() => setTheme('system'))}
                                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-default text-zinc-700 dark:text-zinc-300 aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800/50 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 group"
                                    >
                                        <Monitor className="w-4 h-4 text-zinc-400 group-aria-selected:text-indigo-500" />
                                        <span>System Default</span>
                                    </Command.Item>
                                </Command.Group>
                            </Command.List>
                        </Command>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
