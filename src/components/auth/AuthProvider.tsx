"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const initAuthListener = useAuthStore((state) => state.initAuthListener);

    useEffect(() => {
        const unsubscribe = initAuthListener();
        return () => unsubscribe();
    }, [initAuthListener]);

    return <>{children}</>;
}
