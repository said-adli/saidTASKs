import { db } from './config';
import { doc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { UserProfile } from './userService';

export const rewardService = {
    // Logic: 100 XP per task. Level = floor(sqrt(totalXP / 100)) + 1
    calculateLevel: (xp: number) => {
        return Math.floor(Math.sqrt(xp / 100)) + 1;
    },

    checkDateStreak: (lastDateVal: Date | null): { increment: boolean; break: boolean } => {
        if (!lastDateVal) return { increment: true, break: false }; // First time

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const last = new Date(lastDateVal);
        last.setHours(0, 0, 0, 0);

        const diffTime = today.getTime() - last.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Already completed a task today, streak is maintained but not incremented
            return { increment: false, break: false };
        } else if (diffDays === 1) {
            // Next consecutive day
            return { increment: true, break: false };
        } else {
            // Streak broken
            return { increment: true, break: true };
        }
    },

    grantXP: async (userId: string, amount: number) => {
        const userRef = doc(db, 'users', userId);

        try {
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) {
                    throw new Error("User document does not exist!");
                }

                const data = userDoc.data() as UserProfile;

                // 1. Calculate XP & Level
                const newXp = data.xp + amount;
                const newLevel = rewardService.calculateLevel(newXp);

                // 2. Calculate Streak
                let newStreak = data.currentStreak;
                let newLongestStreak = data.longestStreak;

                const lastDate = data.lastCompletedDate ? data.lastCompletedDate.toDate() : null;
                const streakLogic = rewardService.checkDateStreak(lastDate);

                if (streakLogic.break) {
                    newStreak = 1; // Reset to 1 for today
                } else if (streakLogic.increment) {
                    newStreak += 1;
                }

                if (newStreak > newLongestStreak) {
                    newLongestStreak = newStreak;
                }

                // 3. Update standard fields
                transaction.update(userRef, {
                    xp: newXp,
                    level: newLevel,
                    currentStreak: newStreak,
                    longestStreak: newLongestStreak,
                    lastCompletedDate: serverTimestamp()
                });
            });
        } catch (error) {
            console.error("Reward transaction failed: ", error);
            throw error;
        }
    }
};
