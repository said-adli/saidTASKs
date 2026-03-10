"use client";

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useTagStore } from '@/store/useTagStore';
import { TaskModal } from '@/components/tasks/TaskModal';
import { TaskItem } from '@/components/tasks/TaskItem';
import { AIInsightsCard } from '@/components/dashboard/AIInsightsCard';
import { Plus, LayoutDashboard, AlertCircle, Sparkles, Mic, Trophy, ArrowRight, CheckSquare, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

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

        {/* ─── AI Showcase Visual ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-16 sm:mt-20 w-full max-w-5xl mx-auto z-10"
        >
          {/* Glowing border */}
          <div className="absolute -inset-[1px] bg-gradient-to-b from-indigo-500/50 via-purple-500/20 to-transparent rounded-xl blur-[1px] pointer-events-none" />

          {/* Canvas */}
          <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-indigo-900/30 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 aspect-[16/9]">

            {/* Ambient inner glows */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-purple-500/8 rounded-full blur-[80px] pointer-events-none" />

            {/* ── Animated SVG Flow Lines ─────────────────────── */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="flow1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="flow2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="flow3" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              {/* Flow line 1 – top-left to center */}
              <path
                d="M 5% 15% Q 25% 5%, 50% 45%"
                fill="none" stroke="url(#flow1)" strokeWidth="1.5"
                strokeDasharray="8 12" className="animate-flow-dash"
              />
              {/* Flow line 2 – top-right to center */}
              <path
                d="M 92% 20% Q 75% 10%, 50% 45%"
                fill="none" stroke="url(#flow2)" strokeWidth="1.5"
                strokeDasharray="6 14" className="animate-flow-dash"
                style={{ animationDelay: '-4s' }}
              />
              {/* Flow line 3 – bottom to center */}
              <path
                d="M 30% 90% Q 35% 65%, 50% 50%"
                fill="none" stroke="url(#flow3)" strokeWidth="1"
                strokeDasharray="5 15" className="animate-flow-dash"
                style={{ animationDelay: '-8s' }}
              />
            </svg>

            {/* ── Central AI Core Icon ────────────────────────── */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              {/* Pulse ring */}
              <div className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-indigo-400/30 animate-pulse-ring" />
              {/* Static gradient ring */}
              <div className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-transparent bg-clip-border" style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.25), rgba(192,132,252,0.15)) border-box' }} />
              {/* Core circle */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 shadow-lg shadow-indigo-500/40 flex items-center justify-center">
                <svg viewBox="0 0 40 40" className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-lg">
                  <text x="50%" y="54%" textAnchor="middle" dominantBaseline="central" fill="white" fontWeight="800" fontSize="26" fontFamily="system-ui, sans-serif">S</text>
                </svg>
              </div>
            </div>

            {/* ── Orbital Dots ────────────────────────────────── */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0">
              <div className="animate-orbit">
                <div className="w-2 h-2 rounded-full bg-indigo-400/60 shadow-sm shadow-indigo-400/40" />
              </div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0">
              <div className="animate-orbit-slow">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50" />
              </div>
            </div>

            {/* ── Floating Glassmorphism Cards ────────────────── */}
            {/* Card 1 – top-left */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="animate-float absolute top-[12%] left-[6%] sm:left-[10%] px-4 py-2.5 rounded-lg bg-white/[0.07] backdrop-blur-md border border-white/10 shadow-lg shadow-black/20"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                  <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5l3.5 3.5 6.5-8" /></svg>
                </div>
                <span className="text-xs sm:text-sm font-medium text-white/80">Add daily task ✓</span>
              </div>
            </motion.div>

            {/* Card 2 – top-right */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              className="animate-float-delayed absolute top-[18%] right-[6%] sm:right-[10%] px-4 py-2.5 rounded-lg bg-white/[0.07] backdrop-blur-md border border-white/10 shadow-lg shadow-black/20"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M8 3v8M4 7l4-4 4 4" /></svg>
                </div>
                <span className="text-xs sm:text-sm font-medium text-white/80">+50 XP earned</span>
              </div>
            </motion.div>

            {/* Card 3 – bottom-center */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.6 }}
              className="animate-float absolute bottom-[14%] left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-lg bg-white/[0.07] backdrop-blur-md border border-white/10 shadow-lg shadow-black/20"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                  <Sparkles size={10} className="text-white" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-white/80">Breaking down project...</span>
                <span className="inline-flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </span>
              </div>
            </motion.div>

            {/* Bottom fade */}
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
    if (activeProjectId === 'assigned-to-me') {
      return task.assigneeId === user?.uid;
    }
    return task.projectId === activeProjectId;
  });

  // Gamification Quests Logic
  const todayTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    const due = (t.dueDate as any).toDate ? (t.dueDate as any).toDate() : new Date(((t.dueDate as any).seconds || 0) * 1000);
    const today = new Date();
    return due.getDate() === today.getDate() && due.getMonth() === today.getMonth() && due.getFullYear() === today.getFullYear();
  });
  const completedToday = todayTasks.filter(t => t.status === 'completed').length;
  const inboxProgress = todayTasks.length === 0 ? 0 : Math.round((completedToday / todayTasks.length) * 100);

  const hasSubtasks = tasks.some(t => t.subtasks && t.subtasks.length > 0);
  const mindfulProgress = hasSubtasks ? 100 : 0;

  const streakProgress = profile ? Math.min(Math.round((profile.currentStreak / 3) * 100), 100) : 0;

  const activeTasks = filteredTasks.filter(t => t.status !== 'completed');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  const headerTitle = ['today', 'upcoming', 'important', 'inbox', 'assigned-to-me'].includes(activeProjectId as string)
    ? activeProjectId === 'assigned-to-me' ? 'Assigned to Me'
      : (activeProjectId as string).charAt(0).toUpperCase() + (activeProjectId as string).slice(1)
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
        {/* Proactive AI Insights */}
        <AIInsightsCard />

        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900 flex items-start gap-3 text-red-600 dark:text-red-400">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
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
                  <p>No tasks found. Time to add something new!</p>
                </div>
              )}
            </section>

            {completedTasks.length > 0 && (
              <section className="space-y-4 flex-1">
                <h2 className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">Completed</h2>
                <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity">
                  <AnimatePresence>
                    {completedTasks.map(task => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}
          </div>

          {/* Daily Quests Gamification Sidebar */}
          <div className="lg:col-span-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl p-6 h-fit sticky top-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="text-orange-500" size={24} />
              <h3 className="font-bold text-lg">Daily Quests</h3>
            </div>

            <div className="space-y-4">
              <div className="group flex flex-col gap-2 p-3 rounded-xl border border-orange-200 bg-orange-50 dark:border-orange-900/40 dark:bg-orange-500/10 cursor-default hover:border-orange-300 transition-colors">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Clear the Inbox</span>
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 px-2 py-0.5 rounded-full">+200 XP</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Complete all {todayTasks.length} tasks scheduled for today.</p>
                <div className="w-full bg-orange-200/50 dark:bg-orange-900/30 h-1.5 rounded-full mt-1">
                  <div className="bg-orange-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${inboxProgress}%` }}></div>
                </div>
              </div>

              <div className="group flex flex-col gap-2 p-3 rounded-xl border border-indigo-200 bg-indigo-50 dark:border-indigo-900/40 dark:bg-indigo-500/10 cursor-default hover:border-indigo-300 transition-colors">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Mindful Planner</span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full">+50 XP</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Break down at least one task using AI.</p>
                <div className="w-full bg-indigo-200/50 dark:bg-indigo-900/30 h-1.5 rounded-full mt-1">
                  <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${mindfulProgress}%` }}></div>
                </div>
              </div>

              <div className="group flex flex-col gap-2 p-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-500/10 cursor-default hover:border-emerald-300 transition-colors">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Streak Saver</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">+100 XP</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Log in and complete 1 task for 3 days in a row.</p>
                <div className="w-full bg-emerald-200/50 dark:bg-emerald-900/30 h-1.5 rounded-full mt-1">
                  <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${streakProgress}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
