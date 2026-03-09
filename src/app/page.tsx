"use client";

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useTagStore } from '@/store/useTagStore';
import { TaskModal } from '@/components/tasks/TaskModal';
import { TaskItem } from '@/components/tasks/TaskItem';
import { Plus, LayoutDashboard, AlertCircle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export default function Home() {
  const { user, profile } = useAuthStore();
  const { tasks, loading, error } = useTasks();
  const { projects, activeProjectId } = useProjects();
  const { activeTagId } = useTagStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full mt-20 space-y-4">
        <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">Welcome to ProductivityOS</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-lg">Please login to access your tasks.</p>
      </div>
    );
  }

  const filteredTasks = tasks.filter(task => {
    if (activeTagId && (!task.tagIds || !task.tagIds.includes(activeTagId))) {
      return false;
    }

    if (activeProjectId === 'important') {
      return task.priority === 'urgent' || task.priority === 'high';
    }
    if (activeProjectId === 'today' || activeProjectId === 'upcoming') {
      // Standard views for now before calendar features are finished
      return true;
    }
    if (activeProjectId === 'inbox') {
      const inbox = projects.find(p => p.isDefault);
      return inbox ? task.projectId === inbox.id : true;
    }
    return task.projectId === activeProjectId;
  });

  const activeTasks = filteredTasks.filter(t => t.status !== 'completed');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  const headerTitle = ['today', 'upcoming', 'important', 'inbox'].includes(activeProjectId as string)
    ? (activeProjectId as string).charAt(0).toUpperCase() + (activeProjectId as string).slice(1)
    : projects.find(p => p.id === activeProjectId)?.name || 'Dashboard';

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header section with Gamification Stats preview */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="text-indigo-500" />
            {headerTitle}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Here is what&apos;s happening with your tasks today.</p>
        </div>

        <div className="flex items-center gap-4">
          {profile && (
            <div className="flex gap-4 px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm">
              <div className="flex flex-col">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Level</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{profile.level}</span>
              </div>
              <div className="w-px bg-zinc-200 dark:bg-zinc-800" />
              <div className="flex flex-col">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Streak</span>
                <span className="font-bold text-orange-500">{profile.currentStreak} 🔥</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Task</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="space-y-8">
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900 flex items-start gap-3 text-red-600 dark:text-red-400">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Active Tasks</h2>
            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 text-xs font-bold">
              {activeTasks.length}
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-lg border border-zinc-200 dark:border-zinc-700" />
              ))}
            </div>
          ) : activeTasks.length > 0 ? (
            <div className="space-y-3">
              <AnimatePresence>
                {activeTasks.map(task => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="p-8 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500 dark:text-zinc-400">
              <p>No active tasks. You&apos;re all caught up!</p>
            </div>
          )}
        </section>

        {/* Completed list only renders if there are completed tasks */}
        {completedTasks.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">Completed</h2>
            <div className="space-y-3">
              <AnimatePresence>
                {completedTasks.map(task => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}
      </main>

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
