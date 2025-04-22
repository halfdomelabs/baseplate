import type { SyncMetadata } from '@halfdomelabs/project-builder-server';

import { toast } from '@halfdomelabs/ui-components';
import { useEffect } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { getSyncMetadata } from '@src/services/api/sync';
import { logAndFormatError } from '@src/services/error-formatter';
import { trpc } from '@src/services/trpc';

import { useProjects } from './useProjects';

const useSyncMetadataStore = create<{
  metadata: SyncMetadata | undefined;
  setMetadata: (metadata: SyncMetadata | undefined) => void;
}>((set) => ({
  metadata: undefined,
  setMetadata: (metadata) => {
    set({ metadata });
  },
}));

/**
 * This hook is used to listen for sync metadata changes.
 * It will fetch the sync metadata and update the store when the sync is completed.
 */
export function useSyncMetadataListener(): void {
  const { currentProjectId } = useProjects();
  const { setMetadata } = useSyncMetadataStore();

  useEffect(() => {
    setMetadata(undefined);
    if (!currentProjectId) {
      return;
    }

    getSyncMetadata(currentProjectId)
      .then((metadata) => {
        setMetadata(metadata);
      })
      .catch((error: unknown) => {
        toast.error(logAndFormatError(error, 'Failed to fetch sync metadata.'));
      });

    const subscription = trpc.sync.onSyncMetadataChanged.subscribe(
      { id: currentProjectId },
      {
        onData: (data) => {
          setMetadata(data.syncMetadata);
        },
      },
    );
    return () => {
      subscription.unsubscribe();
    };
  }, [currentProjectId, setMetadata]);
}

/**
 * This hook is used to get the sync metadata.
 */
export function useSyncMetadata<T = SyncMetadata>(
  selector?: (metadata: SyncMetadata) => T,
): T | undefined {
  return useSyncMetadataStore(
    useShallow((state) => {
      if (!state.metadata) {
        return undefined;
      }
      return selector ? selector(state.metadata) : (state.metadata as T);
    }),
  );
}
