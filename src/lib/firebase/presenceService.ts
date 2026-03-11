import { db, rtdb } from './config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, set, onDisconnect, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';

/**
 * Presence Service
 * 
 * Hybrid approach:
 * - Firestore `users/{uid}` doc with `isOnline` boolean and `lastSeen` timestamp for queries.
 * - RTDB `onDisconnect` for reliable crash/tab-close detection (works even if JS doesn't execute).
 * - Heartbeat interval to keep Firestore status fresh.
 * - `visibilitychange` / `beforeunload` for explicit status updates.
 */
export const presenceService = {
    _intervalId: null as ReturnType<typeof setInterval> | null,

    goOnline: async (userId: string) => {
        if (!userId) return;

        const userRef = doc(db, 'users', userId);
        try {
            await setDoc(userRef, {
                isOnline: true,
                lastSeen: serverTimestamp(),
            }, { merge: true });
        } catch (err) {
            console.error('[Presence] Failed to go online:', err);
        }

        // Heartbeat every 120s to keep "online" status fresh (throttled)
        if (presenceService._intervalId) {
            clearInterval(presenceService._intervalId);
        }
        presenceService._intervalId = setInterval(async () => {
            try {
                await setDoc(userRef, {
                    isOnline: true,
                    lastSeen: serverTimestamp(),
                }, { merge: true });
            } catch { /* silent */ }
        }, 120_000);
    },

    goOffline: async (userId: string) => {
        if (!userId) return;

        if (presenceService._intervalId) {
            clearInterval(presenceService._intervalId);
            presenceService._intervalId = null;
        }

        // Use sendBeacon for reliability on tab close when available
        const userRef = doc(db, 'users', userId);
        try {
            await setDoc(userRef, {
                isOnline: false,
                lastSeen: serverTimestamp(),
            }, { merge: true });
        } catch (err) {
            console.error('[Presence] Failed to go offline:', err);
        }
    },

    /**
     * Call this once in a top-level layout/provider to wire up
     * visibility-change, beforeunload, and RTDB onDisconnect listeners.
     */
    init: (userId: string) => {
        presenceService.goOnline(userId);

        // --- RTDB onDisconnect: crash-safe offline detection ---
        // Even if the browser crashes or the tab is killed without firing beforeunload,
        // Firebase RTDB will automatically execute this cleanup.
        try {
            const rtdbPresenceRef = ref(rtdb, `presence/${userId}`);
            set(rtdbPresenceRef, { online: true, lastSeen: rtdbServerTimestamp() });
            onDisconnect(rtdbPresenceRef).set({ online: false, lastSeen: rtdbServerTimestamp() });
        } catch (err) {
            console.error('[Presence] Failed to set RTDB onDisconnect:', err);
        }

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                presenceService.goOnline(userId);
            } else {
                presenceService.goOffline(userId);
            }
        };

        const handleBeforeUnload = () => {
            presenceService.goOffline(userId);
        };

        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            presenceService.goOffline(userId);
        };
    }
};

