import { chatService, ChatMessage, TypingUser } from '@/lib/firebase/chatService';

// Chunk size for the requestAnimationFrame scheduler
const CHUNK_SIZE = 5;

interface WorkspaceChatState {
    messages: ChatMessage[];
    typingUsers: TypingUser[];
    status: 'idle' | 'connecting' | 'connected' | 'error';
    error: string | null;
}

export class WorkspaceChatStore {
    private static instance: WorkspaceChatStore;

    private state: WorkspaceChatState = {
        messages: [],
        typingUsers: [],
        status: 'idle',
        error: null,
    };

    // Internal scheduler state
    private displayBuffer: ChatMessage[] = [];
    private displayedIds: Set<string> = new Set();
    private isScheduling = false;
    private listeners: Set<() => void> = new Set();

    // Firebase subscriptions
    private unsubscribeMessages: (() => void) | null = null;
    private unsubscribeTyping: (() => void) | null = null;

    private currentWorkspaceId: string | null = null;
    private currentUserId: string | null = null;

    private constructor() {
        // Singleton
    }

    public static getInstance(): WorkspaceChatStore {
        if (!WorkspaceChatStore.instance) {
            WorkspaceChatStore.instance = new WorkspaceChatStore();
        }
        return WorkspaceChatStore.instance;
    }

    public subscribe(listener: () => void) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    public getSnapshot() {
        return this.state;
    }

    private notify() {
        this.listeners.forEach((listener) => listener());
    }

    private setState(partialState: Partial<WorkspaceChatState>) {
        this.state = { ...this.state, ...partialState };
        this.notify();
    }

    /**
     * Start the requestAnimationFrame loop to flush the display buffer
     */
    private startScheduler() {
        if (this.isScheduling) return;
        this.isScheduling = true;

        const loop = () => {
            if (this.displayBuffer.length > 0) {
                // Take a chunk of messages from the buffer
                const chunk = this.displayBuffer.splice(0, CHUNK_SIZE);
                
                // Avoid duplicates and add to the public state
                const newMessages = chunk.filter(msg => !this.displayedIds.has(msg.id));
                newMessages.forEach(msg => this.displayedIds.add(msg.id));

                if (newMessages.length > 0) {
                    this.setState({
                        messages: [...this.state.messages, ...newMessages].sort(
                            (a, b) => a.timestamp - b.timestamp
                        )
                    });
                }
            }

            // Continue loop if there are still items, or stop to save CPU
            if (this.displayBuffer.length > 0) {
                requestAnimationFrame(loop);
            } else {
                this.isScheduling = false;
            }
        };

        requestAnimationFrame(loop);
    }

    /**
     * Connect to a specific workspace chat
     */
    public connect(workspaceId: string, currentUserId: string) {
        if (this.currentWorkspaceId === workspaceId && this.currentUserId === currentUserId) {
            return; // Already connected to this workspace
        }

        this.disconnect();

        this.currentWorkspaceId = workspaceId;
        this.currentUserId = currentUserId;

        this.setState({
            status: 'connecting',
            messages: [],
            typingUsers: [],
            error: null
        });

        // Initialize subscriptions
        try {
            this.unsubscribeMessages = chatService.subscribeToMessages(
                workspaceId,
                (incomingMessages) => {
                    // Reset buffer and state on full reload (e.g. initial fetch)
                    // In a production app with pagination, incomingMessages might just be the new ones,
                    // but onValue usually returns the whole query snapshot window.
                    
                    // We will put them in the display buffer
                    const unhandledMessages = incomingMessages.filter(m => !this.displayedIds.has(m.id));
                    
                    if (unhandledMessages.length > 0) {
                         this.displayBuffer.push(...unhandledMessages);
                         this.startScheduler();
                    } else if (this.state.messages.length === 0 && incomingMessages.length > 0) {
                        // Edge case where we re-received the same messages but our local state is empty
                         this.displayBuffer.push(...incomingMessages);
                         this.startScheduler();
                    }
                    
                    this.setState({ status: 'connected' });
                },
                100 // message limit
            );

            this.unsubscribeTyping = chatService.subscribeToTyping(
                workspaceId,
                currentUserId,
                (typingUsers) => {
                    this.setState({ typingUsers });
                }
            );

        } catch (error: any) {
            this.setState({
                status: 'error',
                error: error.message || 'Failed to connect to chat'
            });
        }
    }

    /**
     * Full disconnect and reset. 
     * Useful when logging out or leaving the chat view.
     */
    public disconnect() {
        if (this.unsubscribeMessages) {
            this.unsubscribeMessages();
            this.unsubscribeMessages = null;
        }
        if (this.unsubscribeTyping) {
            // Remove our typing indicator
            if (this.currentWorkspaceId && this.currentUserId) {
                chatService.setTypingStatus(this.currentWorkspaceId, this.currentUserId, "", false);
            }
            this.unsubscribeTyping();
            this.unsubscribeTyping = null;
        }

        this.currentWorkspaceId = null;
        // Keep currentUserId around if we just switched workspaces

        this.state = {
            status: 'idle',
            messages: [],
            typingUsers: [],
            error: null
        };
        this.displayBuffer = [];
        this.displayedIds.clear();
        this.isScheduling = false;
        
        this.notify();
    }
}

export const workspaceChatStore = WorkspaceChatStore.getInstance();
