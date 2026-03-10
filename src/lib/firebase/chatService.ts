import { rtdb } from './config';
import {
    ref,
    push,
    set,
    onValue,
    onChildAdded,
    query,
    limitToLast,
    orderByChild,
    serverTimestamp,
    off,
    remove,
    onDisconnect,
} from 'firebase/database';

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    senderPhoto: string | null;
    text: string;
    timestamp: number;
}

export interface TypingUser {
    userId: string;
    displayName: string;
    timestamp: number;
}

export const chatService = {
    /**
     * Send a message to a workspace chat room.
     */
    sendMessage: async (
        workspaceId: string,
        message: { senderId: string; senderName: string; senderPhoto: string | null; text: string }
    ) => {
        if (!message.text.trim()) return;

        const chatRef = ref(rtdb, `workspaceChat/${workspaceId}/messages`);
        const newMsgRef = push(chatRef);

        await set(newMsgRef, {
            senderId: message.senderId,
            senderName: message.senderName,
            senderPhoto: message.senderPhoto || null,
            text: message.text.trim(),
            timestamp: serverTimestamp(),
        });
    },

    /**
     * Subscribe to the last N messages in a workspace chat.
     * Returns an unsubscribe function.
     */
    subscribeToMessages: (
        workspaceId: string,
        callback: (messages: ChatMessage[]) => void,
        messageLimit: number = 80
    ) => {
        const chatRef = ref(rtdb, `workspaceChat/${workspaceId}/messages`);
        const chatQuery = query(chatRef, orderByChild('timestamp'), limitToLast(messageLimit));

        const handler = onValue(chatQuery, (snapshot) => {
            const messages: ChatMessage[] = [];
            snapshot.forEach((child) => {
                messages.push({
                    id: child.key!,
                    ...child.val(),
                });
            });
            callback(messages);
        });

        // Return unsubscribe function
        return () => off(chatRef, 'value', handler);
    },

    /**
     * Set the current user's typing status.
     * Uses ephemeral RTDB nodes with auto-cleanup via onDisconnect.
     */
    setTypingStatus: (
        workspaceId: string,
        userId: string,
        displayName: string,
        isTyping: boolean
    ) => {
        const typingRef = ref(rtdb, `workspaceChat/${workspaceId}/typing/${userId}`);

        if (isTyping) {
            set(typingRef, {
                displayName,
                timestamp: serverTimestamp(),
            });
            // Auto-remove on disconnect (tab close / network loss)
            onDisconnect(typingRef).remove();
        } else {
            remove(typingRef);
        }
    },

    /**
     * Subscribe to typing indicators for a workspace.
     * Returns an unsubscribe function.
     */
    subscribeToTyping: (
        workspaceId: string,
        currentUserId: string,
        callback: (typingUsers: TypingUser[]) => void
    ) => {
        const typingRef = ref(rtdb, `workspaceChat/${workspaceId}/typing`);

        const handler = onValue(typingRef, (snapshot) => {
            const users: TypingUser[] = [];
            snapshot.forEach((child) => {
                const uid = child.key!;
                if (uid !== currentUserId) {
                    const data = child.val();
                    // Only show if typing within last 10 seconds
                    const now = Date.now();
                    const ts = data.timestamp || 0;
                    if (now - ts < 10_000) {
                        users.push({
                            userId: uid,
                            displayName: data.displayName || 'Someone',
                            timestamp: ts,
                        });
                    }
                }
            });
            callback(users);
        });

        return () => off(typingRef, 'value', handler);
    },
};
