"use client";

import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useTags } from '@/hooks/useTags';

/**
 * A headless component that centrally initializes data pipelines (onSnapshot hooks).
 * By placing this once at the app root, we decouple Firebase listeners from UI components,
 * preventing duplicate network subscriptions when things like the Mobile Sidebar mount.
 */
export function DataSyncLayer() {
    useTasks();
    useProjects();
    useTags();

    return null;
}
