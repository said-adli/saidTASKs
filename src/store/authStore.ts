import { create } from 'zustand';
import { auth, db } from '@/lib/firebase/config';
import {
    User,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface UserProfile {
    xp: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
}

interface AuthStore {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    initAuthListener: () => () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
    user: null,
    profile: null,
    loading: true,
    error: null,

    loginWithGoogle: async () => {
        try {
            set({ loading: true, error: null });
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            // user will be set by the onAuthStateChanged listener
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    logout: async () => {
        try {
            set({ loading: true, error: null });
            await signOut(auth);
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    initAuthListener: () => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is logged in, sync with Firestore
                try {
                    const userRef = doc(db, 'users', user.uid);
                    const userSnap = await getDoc(userRef);

                    let profileData: UserProfile;

                    if (!userSnap.exists()) {
                        // First time login, create initial stats
                        profileData = {
                            xp: 0,
                            level: 1,
                            currentStreak: 0,
                            longestStreak: 0,
                        };
                        await setDoc(userRef, {
                            ...profileData,
                            email: user.email,
                            displayName: user.displayName,
                            photoURL: user.photoURL,
                            createdAt: serverTimestamp(),
                        });
                    } else {
                        const data = userSnap.data();
                        profileData = {
                            xp: data.xp || 0,
                            level: data.level || 1,
                            currentStreak: data.currentStreak || 0,
                            longestStreak: data.longestStreak || 0,
                        };
                    }

                    set({ user, profile: profileData, loading: false });
                } catch (error: any) {
                    console.error("Error fetching user data:", error);
                    set({ user, profile: null, loading: false, error: 'Failed to load profile data' });
                }
            } else {
                // User is logged out
                set({ user: null, profile: null, loading: false });
            }
        });

        return unsubscribe;
    }
}));
