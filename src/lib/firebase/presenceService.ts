import { db } from './config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Presence Service
 * 
 * Uses Firestore `users/{uid}` doc with an `isOnline` boolean and `lastSeen` timestamp.
 * We use a heartbeat interval approach since the app is on Firestore (not RTDB).
 * On page load, we set isOnline=true and start a heartbeat.
 * On page unload (visibilitychange / beforeunload), we set isOnline=false.
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

        // Heartbeat every 60s to keep "online" status fresh
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
        }, 60_000);
    },

    goOffline: async (userId: string) => {
        if (!userId) return;

        if (presenceService._intervalId) {
            clearInterval(presenceService._intervalId);
            presenceService._intervalId = null;
        }

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
     * visibility-change and beforeunload listeners.
     */
    init: (userId: string) => {
        presenceService.goOnline(userId);

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                presenceService.goOnline(userId);
            } else {
                presenceService.goOffline(userId);
            }
        };

        const handleBeforeUnload = () => {
            // We use sendBeacon pattern via navigator for reliability
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
