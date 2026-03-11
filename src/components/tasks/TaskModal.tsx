"use client";

import { useState, useEffect } from 'react';
import * as chrono from 'chrono-node';
import { X } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useTags } from '@/hooks/useTags';
import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/useTaskStore';
import { TaskPriority, SubTask, Attachment, RecurringInterval } from '@/lib/firebase/taskService';
import { uploadToCloudinary } from '@/lib/cloudinary/uploadService';
import { aiService } from '@/lib/gemini/aiService';
import { aiAuditorService } from '@/lib/gemini/aiAuditorService';
import { userService } from '@/lib/firebase/userService';
import { Sparkles, Loader2, Paperclip, File as FileIcon, Image as ImageIcon, Tag as TagIcon, Repeat, UserCircle, Wand2 } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useWorkspaceStore } from '@/store/workspaceStore';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDueDate?: Date | null;
}

export function TaskModal({ isOpen, onClose, initialDueDate }: TaskModalProps) {
    const { user } = useAuthStore();
    const { addTask } = useTasks();
    const { projects, activeProjectId } = useProjects();
    const { tags } = useTags();
    const { memberProfiles } = useWorkspaceStore();
    const members = Object.values(memberProfiles);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('medium');

    // Determine default project
    const isSmartList = ['inbox', 'today', 'upcoming', 'important'].includes(activeProjectId as string);
    const inboxId = projects.find(p => p.isDefault)?.id || '';
    const initialProjectId = !isSmartList ? (activeProjectId as string) : inboxId;

    const [projectId, setProjectId] = useState(initialProjectId);
    const [dueDate, setDueDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialDueDate) {
                // Get YYYY-MM-DD format tailored to local timezone for the date input
                const year = initialDueDate.getFullYear();
                const month = String(initialDueDate.getMonth() + 1).padStart(2, '0');
                const day = String(initialDueDate.getDate()).padStart(2, '0');
                setDueDate(`${year}-${month}-${day}`);
            } else {
                setDueDate('');
            }
        }
    }, [isOpen, initialDueDate]);

    // NLP Date Auto-Parsing
    useEffect(() => {
        if (!isOpen || !title.trim()) return;

        const timer = setTimeout(() => {
            const parsed = chrono.parse(title);
            if (parsed && parsed.length > 0) {
                const result = parsed[0];
                const date = result.start.date();

                // Format for our date input (YYYY-MM-DD)
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');

                setDueDate(`${year}-${month}-${day}`);

                // Remove the parsed text from title
                const newTitle = title.replace(result.text, '').replace(/\s+/g, ' ').trim();
                if (newTitle !== title) {
                    setTitle(newTitle);
                    toast.success(`Date auto-set: ${result.text}`, { icon: '🤖', id: 'nlp-toast' });
                }
            }
        }, 1500); // 1.5s delay after they stop typing

        return () => clearTimeout(timer);
    }, [title, isOpen]);

    const [subtasks, setSubtasks] = useState<SubTask[]>([]);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [recurringInterval, setRecurringInterval] = useState<RecurringInterval | ''>('');
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    const [assigneeId, setAssigneeId] = useState<string>('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isBreakingDown, setIsBreakingDown] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isEnriching, setIsEnriching] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const newAttachment = await uploadToCloudinary(file);
            setAttachments(prev => [...prev, newAttachment]);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload file.");
        } finally {
            setIsUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleAIBreakdown = async () => {
        if (!title.trim() || !user) return;
        try {
            setIsBreakingDown(true);
            const steps = await aiService.breakDownTask(title.trim(), description.trim());
            const newSubtasks: SubTask[] = steps.map((step, idx) => ({
                id: `st_${Date.now()}_${idx}`,
                title: step,
                isCompleted: false
            }));
            setSubtasks(newSubtasks);
            
            // Grant Gamification XP via the central reward path
            await userService.rewardTaskCompletion(user.uid);
            toast.success("AI Breakdown generated! +100 XP");
        } catch (error) {
            console.error("Failed to break down task", error);
            alert("Could not break down task. Make sure Gemini API Key is set.");
        } finally {
            setIsBreakingDown(false);
        }
    };

    const handleMagicEnrichment = async () => {
        if (!title.trim()) {
            toast.error("Please enter a title first.");
            return;
        }
        try {
            setIsEnriching(true);
            const tasksHistory = useTaskStore.getState?.()?.tasks || [];
            // Fallback if we don't have global direct access: just use currently loaded tasks

            const result = await aiAuditorService.enrichTask(
                title.trim(),
                description.trim(),
                members,
                tasksHistory
            );

            if (result.suggestedDescription) {
                setDescription(result.suggestedDescription);
            }
            if (result.recommendedAssigneeId) {
                setAssigneeId(result.recommendedAssigneeId);
                const assignedMember = memberProfiles[result.recommendedAssigneeId];
                if (assignedMember) {
                    toast.success(`Gemini assigned to ${assignedMember.displayName || 'member'}`, { icon: '✨' });
                }
            } else {
                toast.success("Description enriched!", { icon: '✨' });
            }

        } catch (error: any) {
            console.error("Failed to enrich task", error);
            toast.error("Failed to generate magic enrichment. Check your API key.");
        } finally {
            setIsEnriching(false);
        }
    };

    const toggleTag = (tagId: string) => {
        setSelectedTagIds(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !title.trim()) return;

        try {
            setIsSubmitting(true);
            const parsedDueDate = dueDate ? Timestamp.fromDate(new Date(dueDate)) : null;

            // Wait for the optimistic store update
            await addTask({
                title: title.trim(),
                description: description.trim(),
                priority,
                status: 'todo',
                projectId: projectId || inboxId,
                dueDate: parsedDueDate,
                subtasks,
                attachments,
                tagIds: selectedTagIds,
                recurringInterval: recurringInterval || null,
                assigneeId: assigneeId || null
            } as any);

            // Fire assignment toast if someone was assigned
            if (assigneeId && assigneeId !== user.uid) {
                const assignee = memberProfiles[assigneeId];
                toast.success(`Assigned '${title.trim()}' to ${assignee?.displayName || 'team member'}`, { icon: '👤' });
            }

            setTitle('');
            setDescription('');
            setPriority('medium');
            setDueDate('');
            setSubtasks([]);
            setAttachments([]);
            setRecurringInterval('');
            setSelectedTagIds([]);
            setAssigneeId('');
            setProjectId(initialProjectId);
            onClose();

            // Fire Success Toast
            toast.success('Task created successfully!');
        } catch (error: any) {
            console.error("Failed to add task", error);
            toast.error(error.message || 'Failed to create task');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Create New Task</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                    <div className="p-6 space-y-6 overflow-y-auto">
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Task Title</label>
                                <button
                                    type="button"
                                    onClick={handleAIBreakdown}
                                    disabled={!title.trim() || isBreakingDown}
                                    className="px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-sm disabled:opacity-50 transition-colors"
                                >
                                    {isBreakingDown ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                    AI Breakdown
                                </button>
                            </div>
                            <input
                                type="text"
                                required
                                autoFocus
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="What needs to be done?"
                                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-zinc-400"
                            />
                        </div>

                        {subtasks.length > 0 && (
                            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-900/50 rounded-lg space-y-2">
                                <h4 className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles size={12} /> Generated Sub-tasks
                                </h4>
                                <ul className="space-y-1.5">
                                    {subtasks.map((st, i) => (
                                        <li key={st.id} className="text-sm text-zinc-700 dark:text-zinc-300 flex items-start gap-2">
                                            <span className="text-indigo-400 font-medium select-none">{i + 1}.</span>
                                            {st.title}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
                                <button
                                    type="button"
                                    onClick={handleMagicEnrichment}
                                    disabled={!title.trim() || isEnriching}
                                    className="px-2 py-1 flex items-center gap-1 text-[10px] sm:text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-md transition-colors disabled:opacity-50"
                                >
                                    {isEnriching ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                                    Magic Fill
                                </button>
                            </div>
                            <textarea
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add additional details or markdown..."
                                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-zinc-400 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Project</label>
                                <select
                                    value={projectId}
                                    onChange={(e) => setProjectId(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                >
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                                    <UserCircle size={14} className="text-zinc-500" /> Assign To
                                </label>
                                <select
                                    value={assigneeId}
                                    onChange={(e) => setAssigneeId(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                >
                                    <option value="">Unassigned</option>
                                    {members.map(m => (
                                        <option key={m.userId} value={m.userId}>
                                            {m.displayName || m.email || 'User'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Due Date</label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Priority</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                                    <Repeat size={14} className="text-zinc-500" /> Recurring
                                </label>
                                <select
                                    value={recurringInterval}
                                    onChange={(e) => setRecurringInterval(e.target.value as any)}
                                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                >
                                    <option value="">Does not repeat</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>

                            {tags.length > 0 && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                                        <TagIcon size={14} className="text-zinc-500" /> Tags
                                    </label>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {tags.map(tag => {
                                            const isSelected = selectedTagIds.includes(tag.id);
                                            return (
                                                <button
                                                    key={tag.id}
                                                    type="button"
                                                    onClick={() => toggleTag(tag.id)}
                                                    className={cn(
                                                        "px-2 py-1 text-xs font-medium rounded-full border transition-all",
                                                        isSelected
                                                            ? "border-transparent text-white"
                                                            : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600"
                                                    )}
                                                    style={isSelected ? { backgroundColor: tag.color || '#4f46e5' } : {}}
                                                >
                                                    {tag.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Attachments</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {attachments.map(att => (
                                    <div key={att.id} className="relative group flex items-center gap-2 px-2 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md max-w-[200px]">
                                        {att.type.startsWith('image/') ? <ImageIcon size={14} className="text-zinc-500 shrink-0" /> : <FileIcon size={14} className="text-zinc-500 shrink-0" />}
                                        <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate">
                                            {att.name}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <label
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                                {isUploading ? 'Uploading...' : 'Attach File'}
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                            </label>
                        </div>

                    </div>
                    <div className="flex justify-end gap-3 p-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim() || isSubmitting}
                            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
