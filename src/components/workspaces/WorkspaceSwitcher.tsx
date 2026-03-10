"use client";

import { useState } from 'react';
import { Check, ChevronsUpDown, Plus, Briefcase, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { JoinWorkspaceModal } from './JoinWorkspaceModal';
import { InviteModal } from './InviteModal';
import { useAuthStore } from '@/store/authStore';

export function WorkspaceSwitcher() {
    const [open, setOpen] = useState(false);
    const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
    const [showJoinWorkspaceModal, setShowJoinWorkspaceModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);

    const { workspaces, activeWorkspaceId, setActiveWorkspaceId } = useWorkspaceStore();
    const { user } = useAuthStore();

    const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

    // Permission guard: Only Owner can see the 'Invite' button
    const isOwner = activeWorkspace?.ownerId === user?.uid;

    if (workspaces.length === 0) return null;

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between mt-2 px-3 py-2 h-auto text-left font-normal bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 transition-all group border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600"
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-500 text-white font-bold text-xs shrink-0">
                                {activeWorkspace?.name.charAt(0).toUpperCase() || 'W'}
                            </div>
                            <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {activeWorkspace?.name || 'Select Workspace'}
                            </span>
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform group-hover:scale-110" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0 shadow-lg border-zinc-200 dark:border-zinc-800">
                    <Command>
                        <CommandList>
                            <CommandInput placeholder="Search workspace..." />
                            <CommandEmpty>No workspace found.</CommandEmpty>
                            <CommandGroup heading="Your Workspaces">
                                {workspaces.map((workspace) => (
                                    <CommandItem
                                        key={workspace.id}
                                        onSelect={() => {
                                            setActiveWorkspaceId(workspace.id);
                                            setOpen(false);
                                        }}
                                        className="gap-2 cursor-pointer"
                                    >
                                        <div className="flex items-center justify-center w-5 h-5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold text-[10px] shrink-0">
                                            {workspace.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="truncate">{workspace.name}</span>
                                        <Check
                                            className={cn(
                                                "ml-auto h-4 w-4",
                                                activeWorkspaceId === workspace.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                        <CommandSeparator />
                        <CommandList>
                            <CommandGroup>
                                {isOwner && (
                                    <CommandItem
                                        onSelect={() => {
                                            setOpen(false);
                                            setShowInviteModal(true);
                                        }}
                                        className="cursor-pointer gap-2"
                                    >
                                        <UserPlus className="h-4 w-4 text-indigo-500" />
                                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">Invite Members</span>
                                    </CommandItem>
                                )}
                                <CommandItem
                                    onSelect={() => {
                                        setOpen(false);
                                        setShowJoinWorkspaceModal(true);
                                    }}
                                    className="cursor-pointer gap-2"
                                >
                                    <Briefcase className="h-4 w-4" />
                                    <span>Join Workspace</span>
                                </CommandItem>
                                <CommandItem
                                    onSelect={() => {
                                        setOpen(false);
                                        setShowNewWorkspaceModal(true);
                                    }}
                                    className="cursor-pointer gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Create Workspace</span>
                                </CommandItem>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <CreateWorkspaceModal
                isOpen={showNewWorkspaceModal}
                onClose={() => setShowNewWorkspaceModal(false)}
            />

            <JoinWorkspaceModal
                isOpen={showJoinWorkspaceModal}
                onClose={() => setShowJoinWorkspaceModal(false)}
            />

            <InviteModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
            />
        </>
    );
}
