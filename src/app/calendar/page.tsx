"use client";

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTasks } from '@/hooks/useTasks';
import { TaskModal } from '@/components/tasks/TaskModal';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CalendarPage() {
    const { user } = useAuthStore();
    const { tasks } = useTasks();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "MMMM yyyy";
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const activeTasks = tasks.filter(t => t.status !== 'completed' && t.dueDate);

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const handleDayClick = (day: Date) => {
        setSelectedDate(day);
        setIsModalOpen(true);
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full mt-20 space-y-4">
                <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">Calendar</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-lg">Please login to access your calendar.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 h-full flex flex-col animate-in fade-in duration-500">
            <header className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-2xl font-bold text-zinc-900 dark:text-white">
                        <CalendarIcon className="text-indigo-500" />
                        <span>{format(currentDate, dateFormat)}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                        <button
                            onClick={prevMonth}
                            className="p-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-700 bg-transparent rounded-md transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-3 py-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-700 rounded-md transition-colors"
                        >
                            Today
                        </button>
                        <button
                            onClick={nextMonth}
                            className="p-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-700 bg-transparent rounded-md transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <button
                        onClick={() => { setSelectedDate(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Add Task</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-2 text-center text-xs font-semibold text-zinc-500 tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 grid-rows-5 flex-1 overflow-auto">
                    {days.slice(0, 35).map((day, _i) => {
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isTodayDate = isToday(day);

                        const dayTasks = activeTasks.filter(task => {
                            if (!task.dueDate) return false;
                            const dDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date((task.dueDate as any).seconds * 1000);
                            return isSameDay(dDate, day);
                        });

                        return (
                            <div
                                key={day.toString()}
                                onClick={() => handleDayClick(day)}
                                className={cn(
                                    "min-h-[100px] border-r border-b border-zinc-200 dark:border-zinc-800 p-2 cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 flex flex-col gap-1 overflow-y-auto group scrollbar-none",
                                    !isCurrentMonth ? "bg-zinc-50/50 dark:bg-zinc-900/50 opacity-50" : ""
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={cn(
                                        "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mt-0.5",
                                        isTodayDate
                                            ? "bg-indigo-600 text-white"
                                            : "text-zinc-700 dark:text-zinc-300"
                                    )}>
                                        {format(day, "d")}
                                    </span>
                                    <Plus size={14} className="text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                <div className="flex flex-col gap-1 mt-1">
                                    {dayTasks.map(task => (
                                        <div
                                            key={task.id}
                                            className="px-1.5 py-1 text-[10px] sm:text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 rounded border border-indigo-100 dark:border-indigo-900/50 truncate"
                                            title={task.title}
                                        >
                                            {task.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialDueDate={selectedDate} />
        </div>
    );
}
