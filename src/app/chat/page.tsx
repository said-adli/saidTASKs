import { Metadata } from 'next';
import { WorkspaceChat } from '@/components/chat/WorkspaceChat';

export const metadata: Metadata = {
    title: 'Workspace Chat | saidTASKs',
    description: 'Real-time professional workspace communication',
};

export default function ChatPage() {
    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
            <WorkspaceChat />
        </div>
    );
}
