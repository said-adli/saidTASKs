"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useAuthStore } from '@/store/authStore';

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PRESET_COLORS = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#0ea5e9', // sky
    '#6366f1', // indigo
    '#d946ef', // fuchsia
    '#8b5cf6', // violet
];

export function ProjectModal({ isOpen, onClose }: ProjectModalProps) {
    const { user } = useAuthStore();
    const { addProject } = useProjects();

    const [name, setName] = useState('');
    const [color, setColor] = useState(PRESET_COLORS[5]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name.trim()) return;

        try {
            setIsSubmitting(true);
            await addProject(user.uid, {
                name: name.trim(),
                color,
                icon: 'folder', // Standard icon for now
            } as any);

            setName('');
            setColor(PRESET_COLORS[5]);
            onClose();
        } catch (error) {
            console.error("Failed to add project", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">New Project</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Project Name</label>
                        <input
                            type="text"
                            required
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Marketing Campaign"
                            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-zinc-400"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Color</label>
                        <div className="flex flex-wrap gap-3">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-zinc-400 dark:ring-offset-zinc-900' : 'hover:scale-110'}`}
                                    style={{ backgroundColor: c }}
                                    aria-label={`Select color ${c}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || isSubmitting}
                            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
