"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { workspaceService } from '@/lib/firebase/workspaceService';
import toast from 'react-hot-toast';

interface JoinWorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function JoinWorkspaceModal({ isOpen, onClose }: JoinWorkspaceModalProps) {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuthStore();
    const { fetchWorkspaces, setActiveWorkspaceId } = useWorkspaceStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim() || !user) return;

        setIsLoading(true);
        try {
            const workspaceId = await workspaceService.joinWorkspaceByCode(code.trim(), user.uid);

            await fetchWorkspaces(user.uid);
            setActiveWorkspaceId(workspaceId);

            toast.success('Joined workspace successfully!');
            setCode('');
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to join workspace');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Join Workspace</DialogTitle>
                        <DialogDescription>
                            Enter the 6-character Join Code provided by the workspace owner.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="join-code">Join Code</Label>
                            <Input
                                id="join-code"
                                value={code}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.toUpperCase())}
                                placeholder="E.g., A1B2C3"
                                disabled={isLoading}
                                className="font-mono uppercase tracking-widest"
                                maxLength={6}
                                autoFocus
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={code.trim().length < 6 || isLoading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {isLoading ? 'Joining...' : 'Join Workspace'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
