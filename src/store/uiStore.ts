import { create } from 'zustand'

interface UIStore {
    isCmdKOpen: boolean;
    setCmdKOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
    isCmdKOpen: false,
    setCmdKOpen: (open) => set({ isCmdKOpen: open }),
}));
