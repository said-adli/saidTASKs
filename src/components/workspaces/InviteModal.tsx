"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function InviteModal({ isOpen, onClose }: InviteModalProps) {
    const { workspaces, activeWorkspaceId } = useWorkspaceStore();
    const [copied, setCopied] = useState(false);

    const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

    // In migrated workspaces, joinCode might be missing.
    // In a prod app, we'd script a patch, but here we fallback gracefully.
    const joinCode = activeWorkspace?.joinCode || 'MIGRATED';

    const handleCopy = () => {
        navigator.clipboard.writeText(joinCode);
        setCopied(true);
        toast.success('Join Code copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    if (!activeWorkspace) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Invite to {activeWorkspace.name}</DialogTitle>
                    <DialogDescription>
                        Anyone with this code will be able to join your workspace and collaborate on tasks.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2 pt-4">
                    <div className="grid flex-1 gap-2">
                        <Label htmlFor="link" className="sr-only">
                            Link
                        </Label>
                        <Input
                            id="link"
                            defaultValue={joinCode}
                            readOnly
                            className="font-mono text-center tracking-widest uppercase text-lg"
                        />
                    </div>
                    <Button type="button" size="sm" className="px-3" onClick={handleCopy}>
                        <span className="sr-only">Copy</span>
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
