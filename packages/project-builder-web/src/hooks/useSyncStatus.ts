import { create } from 'zustand';

interface SyncStatusState {
  lastSyncedAt: Date | null;
  setLastSyncedAt: (lastSyncedAt: Date) => void;
}

export const useSyncStatusStore = create<SyncStatusState>((set) => ({
  lastSyncedAt: null,
  setLastSyncedAt: (lastSyncedAt: Date) => set({ lastSyncedAt }),
}));
