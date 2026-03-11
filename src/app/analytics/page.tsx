"use client";

import { useAuthStore } from '@/store/authStore';
import { useTasks } from '@/hooks/useTasks';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart2, Zap, Target, Star, Trophy } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

interface FirebaseTimestamp {
    toDate?: () => Date;
    seconds?: number;
}

export default function AnalyticsPage() {
    const { user, profile, loading } = useAuthStore();
    const { tasks } = useTasks();
    const { activeWorkspaceId } = useWorkspaceStore();
    const { theme } = useTheme();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Generate last 7 days data
    const chartData = useMemo(() => {
        const data = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            // Count completed tasks for this specific date
            const count = tasks.filter(t => {
                if (t.status !== 'completed' || !t.updatedAt) return false;
                // We use updatedAt as the completion date proxy for simplicity in this demo
                const ts = t.updatedAt as FirebaseTimestamp;
                const completedDate = ts.toDate ? ts.toDate() : new Date((ts.seconds || 0) * 1000);

                return completedDate.getDate() === date.getDate() &&
                    completedDate.getMonth() === date.getMonth() &&
                    completedDate.getFullYear() === date.getFullYear();
            }).length;

            data.push({
                name: date.toLocaleDateString('en-US', { weekday: 'short' }),
                tasks: count,
                isToday: i === 0
            });
        }
        return data;
    }, [tasks]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full mt-20 space-y-4 animate-pulse">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-500 dark:text-zinc-400">Loading your stats...</p>
            </div>
        );
    }

    if (!user || !profile) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full mt-20 space-y-4">
                <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">Analytics</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-lg">Please login to view your productivity stats.</p>
            </div>
        );
    }

    const totalCompleted = tasks.filter(t => t.status === 'completed').length;
    const completionRate = tasks.length > 0 ? Math.round((totalCompleted / tasks.length) * 100) : 0;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <BarChart2 className="text-indigo-500" />
                        Productivity Analytics
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">Track your progress and build consistent habits.</p>
                </div>
            </header>

            {/* Gamification Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-start gap-4">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <Trophy size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Current Level</p>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{profile.level}</h3>
                    </div>
                </div>

                <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-start gap-4">
                    <div className="p-3 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-lg">
                        <Zap size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Current Streak</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{profile.currentStreak}</h3>
                            <span className="text-sm text-zinc-500 font-medium">days</span>
                        </div>
                    </div>
                </div>

                <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-start gap-4">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-lg">
                        <Star size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total XP</p>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{profile.xp}</h3>
                    </div>
                </div>

                <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-start gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg">
                        <Target size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Completion Rate</p>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{completionRate}%</h3>
                    </div>
                </div>
            </div>

            {/* Recharts Bar Chart (Workspace Context) */}
            {!activeWorkspaceId ? (
                <div className="p-12 text-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col items-center justify-center">
                    <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-4">
                        <BarChart2 className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Workspace Performance</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm">Select a workspace from the sidebar to view your task completion trends and statistics.</p>
                </div>
            ) : (
                <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Tasks Completed</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Your output over the last 7 days in this workspace.</p>
                    </div>

                <div className="h-72 w-full min-h-[300px]">
                    {isMounted && (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#71717a', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#71717a', fontSize: 12 }}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                                    contentStyle={{
                                        backgroundColor: 'rgba(24, 24, 27, 0.9)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                    itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="tasks" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.isToday ? '#6366f1' : (theme === 'dark' ? '#3730a3' : '#c7d2fe')}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
            )}
        </div>
    );
}
