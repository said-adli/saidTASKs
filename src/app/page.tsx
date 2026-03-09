"use client";

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useTagStore } from '@/store/useTagStore';
import { TaskModal } from '@/components/tasks/TaskModal';
import { TaskItem } from '@/components/tasks/TaskItem';
import { Plus, LayoutDashboard, AlertCircle, Sparkles, Mic, Trophy, ArrowRight, CheckSquare, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Loading from './loading';

// ─── Animation Variants ─────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

// ─── Feature Data ────────────────────────────────────────────────────
const features = [
  {
    icon: Sparkles,
    title: 'AI Task Breakdown',
    description: 'Powered by Gemini. Turn complex goals into actionable sub-tasks with one click.',
    gradient: 'from-indigo-500 to-purple-500',
    glow: 'group-hover:shadow-indigo-500/25',
  },
  {
    icon: Mic,
    title: 'Voice Commands',
    description: 'Hands-free task management. Say "Add task" or "Go to board" — we handle the rest.',
    gradient: 'from-cyan-500 to-blue-500',
    glow: 'group-hover:shadow-cyan-500/25',
  },
  {
    icon: Trophy,
    title: 'Gamified Progress',
    description: 'Earn XP, level up, and build streaks. Turn productivity into a game you want to win.',
    gradient: 'from-amber-500 to-orange-500',
    glow: 'group-hover:shadow-amber-500/25',
  },
];

// ═════════════════════════════════════════════════════════════════════
// LANDING PAGE — shown when the user is NOT logged in
// ═════════════════════════════════════════════════════════════════════
function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <>
      {/* ─── Top Nav ──────────────────────────────────────────── */}
      <nav className="w-full flex items-center justify-between px-6 sm:px-10 py-5 absolute top-0 left-0 z-20">
        <div className="flex items-center gap-2 text-white font-bold text-xl">
          <CheckSquare className="text-indigo-400" size={26} />
          <span>saidTASKs</span>
        </div>
        <button
          onClick={onLogin}
          className="px-5 py-2 text-sm font-medium text-white border border-white/20 rounded-lg hover:bg-white/10 transition-colors backdrop-blur-sm"
        >
          Sign In
        </button>
      </nav>

      {/* ─── Hero Section ─────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center pt-36 sm:pt-44 pb-10 px-6">
        {/* Ambient glow */}
        <div className="absolute top-20 w-[600px] h-[400px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10 max-w-4xl mx-auto flex flex-col items-center"
        >
          {/* Badge */}
          <motion.div variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-indigo-300 mb-8 backdrop-blur-sm">
              <Zap size={12} className="text-amber-400" />
              Powered by Gemini AI
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight"
          >
            <span className="text-white">saidTASKs:</span>{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer">
              Your AI-Powered
            </span>
            <br />
            <span className="text-white">Productivity Brain</span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed"
          >
            Organize, automate with Gemini AI, and gamify your life.
            <br className="hidden sm:block" />
            The all-in-one OS for high achievers.
          </motion.p>

          {/* CTA */}
          <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-col sm:flex-row gap-4">
            <button
              onClick={onLogin}
              className="group relative px-8 py-4 text-base font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="flex items-center gap-2">
                Get Started for Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </motion.div>
        </motion.div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-16 sm:mt-20 w-full max-w-5xl mx-auto z-10"
        >
          {/* Glowing border */}
          <div className="absolute -inset-[1px] bg-gradient-to-b from-indigo-500/50 via-purple-500/20 to-transparent rounded-xl blur-[1px] pointer-events-none" />
          <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-indigo-900/30">
            <Image
              src="/dashboard-mockup.png"
              alt="saidTASKs Dashboard Preview"
              width={1920}
              height={1080}
              className="w-full h-auto"
              priority
            />
            {/* Fade-to-black at the bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
          </div>
        </motion.div>
      </section>

      {/* ─── Features Grid ───────────────────────────────────── */}
      <section className="relative px-6 sm:px-10 py-24 max-w-6xl mx-auto w-full">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold text-white">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              ship faster
            </span>
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="mt-4 text-slate-400 text-lg max-w-xl mx-auto">
            Built for individuals who treat productivity like a craft.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                custom={i}
                className={`group relative p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.05] transition-all duration-300 hover:shadow-2xl ${feature.glow}`}
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ─── Bottom CTA ──────────────────────────────────────── */}
      <section className="relative px-6 pb-20 pt-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="max-w-2xl mx-auto text-center"
        >
          <motion.h3 variants={fadeUp} custom={0} className="text-2xl sm:text-3xl font-bold text-white">
            Ready to upgrade your workflow?
          </motion.h3>
          <motion.p variants={fadeUp} custom={1} className="mt-3 text-slate-400">
            Join saidTASKs and turn your to-do list into a leveling system.
          </motion.p>
          <motion.div variants={fadeUp} custom={2} className="mt-8">
            <button
              onClick={onLogin}
              className="group px-8 py-4 text-base font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="flex items-center gap-2">
                Get Started for Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-6 text-center">
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} saidTASKs. Built with Next.js, Firebase & Gemini AI.
        </p>
      </footer>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════
// DASHBOARD — shown when the user IS logged in (original code)
// ═════════════════════════════════════════════════════════════════════
function Dashboard() {
  const { user, profile } = useAuthStore();
  const { tasks, loading, error } = useTasks();
  const { projects, activeProjectId } = useProjects();
  const { activeTagId } = useTagStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredTasks = tasks.filter(task => {
    if (activeTagId && (!task.tagIds || !task.tagIds.includes(activeTagId))) {
      return false;
    }

    if (activeProjectId === 'important') {
      return task.priority === 'urgent' || task.priority === 'high';
    }
    if (activeProjectId === 'today' || activeProjectId === 'upcoming') {
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

// ═════════════════════════════════════════════════════════════════════
// ROOT PAGE — routes between Landing and Dashboard
// ═════════════════════════════════════════════════════════════════════
export default function Home() {
  const { user, loading, loginWithGoogle } = useAuthStore();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <LandingPage onLogin={loginWithGoogle} />;
  }

  return <Dashboard />;
}
