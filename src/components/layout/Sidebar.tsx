"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Folder, Kanban, Calendar, BarChart2, CheckSquare, Inbox, Calendar as CalendarIcon, Star, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjects } from '@/hooks/useProjects';
import { useTags } from '@/hooks/useTags';
import { useAuthStore } from '@/store/authStore';
import { useTagStore } from '@/store/useTagStore';
import { useState } from 'react';
import { ProjectModal } from '@/components/projects/ProjectModal';
import { TagModal } from '@/components/tags/TagModal';

const topNavItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Board', href: '/board', icon: Kanban },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Analytics', href: '/analytics', icon: BarChart2 },
];

const smartLists = [
    { id: 'inbox', name: 'Inbox', icon: Inbox },
    { id: 'today', name: 'Today', icon: CalendarIcon },
    { id: 'upcoming', name: 'Upcoming', icon: CalendarIcon },
    { id: 'important', name: 'Important', icon: Star },
];

export default function Sidebar({ onNavItemClick }: { onNavItemClick?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const { projects, activeProjectId, setActiveProjectId } = useProjects();
    const { tags } = useTags();
    const { activeTagId, setActiveTagId } = useTagStore();
    const { profile } = useAuthStore();
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);

    // Calculate XP needed for next level: nextLevel^2 * 10
    const currentLevel = profile ? profile.level : 1;
    const currentXP = profile ? profile.xp : 0;
    const xpForCurrentLevel = Math.pow(currentLevel - 1, 2) * 10;
    const xpForNextLevel = Math.pow(currentLevel, 2) * 10;
    const progressPercent = profile
        ? ((currentXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100
        : 0;

    return (
        <aside className="w-64 border-r bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 flex flex-col h-full shrink-0">
            <div className="h-20 flex flex-col justify-center px-6 border-b border-zinc-200 dark:border-zinc-800 gap-2 shrink-0">
                <div className="flex items-center gap-2">
                    <CheckSquare size={24} className="text-indigo-500" />
                    <span className="font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 text-xl">
                        saidTASKs
                    </span>
                </div>
                {/* Gamification Mini Progress Bar */}
                {profile && (
                    <div className="w-full space-y-1 group">
                        <div className="flex items-center justify-between text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
                            <span>Lvl {currentLevel}</span>
                            <span className="flex items-center gap-1"><Star size={10} className="text-orange-500" /> {profile.currentStreak}</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden" title={`${currentXP} XP / ${xpForNextLevel} XP`}>
                            <div
                                className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
                                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
                {/* Main Nav */}
                <nav className="space-y-1">
                    {topNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onNavItemClick}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                                        : "text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                                )}
                            >
                                <Icon size={18} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Smart Lists */}
                <div className="space-y-1">
                    <h3 className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Smart Lists</h3>
                    {smartLists.map((list) => {
                        const isActive = activeProjectId === list.id && pathname === '/';
                        const Icon = list.icon;
                        return (
                            <button
                                key={list.id}
                                onClick={() => {
                                    setActiveProjectId(list.id);
                                    if (pathname !== '/') router.push('/');
                                    if (onNavItemClick) onNavItemClick();
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                                        : "text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                                )}
                            >
                                <Icon size={18} className={list.id === 'important' ? "text-yellow-500" : ""} />
                                {list.name}
                            </button>
                        );
                    })}
                </div>

                {/* Projects */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between px-3 mb-2 mt-4">
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Projects</h3>
                        <button
                            onClick={() => setIsProjectModalOpen(true)}
                            className="text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                    {projects.filter(p => !p.isDefault).map((project) => {
                        const isActive = activeProjectId === project.id && pathname === '/';
                        return (
                            <button
                                key={project.id}
                                onClick={() => {
                                    setActiveTagId(null);
                                    setActiveProjectId(project.id);
                                    if (onNavItemClick) onNavItemClick();
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                    isActive && !activeTagId
                                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                                        : "text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                                )}
                            >
                                <span
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: project.color }}
                                />
                                <span className="truncate">{project.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                    <div className="space-y-1 pb-4">
                        <div className="flex items-center justify-between px-3 mb-2 mt-4">
                            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tags</h3>
                            <button
                                onClick={() => setIsTagModalOpen(true)}
                                className="text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 px-3">
                            {tags.map((tag) => {
                                const isActive = activeTagId === tag.id;
                                return (
                                    <button
                                        key={tag.id}
                                        onClick={() => {
                                            setActiveTagId(isActive ? null : tag.id);
                                            if (onNavItemClick) onNavItemClick();
                                        }}
                                        className={cn(
                                            "px-2 py-1 rounded-md text-xs font-medium transition-colors border",
                                            isActive
                                                ? "text-white border-transparent"
                                                : "text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                                        )}
                                        style={isActive ? { backgroundColor: tag.color } : {}}
                                    >
                                        #{tag.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
                {tags.length === 0 && (
                    <div className="space-y-1 pb-4">
                        <div className="flex items-center justify-between px-3 mb-2 mt-4">
                            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tags</h3>
                            <button
                                onClick={() => setIsTagModalOpen(true)}
                                className="text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} />
            <TagModal isOpen={isTagModalOpen} onClose={() => setIsTagModalOpen(false)} />
        </aside>
    );
}
