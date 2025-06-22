import type { SyncMetadata } from '@baseplate-dev/project-builder-server';

import { toast } from '@baseplate-dev/ui-components';
import { useEffect } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { ProjectNotFoundError } from '#src/services/api/index.js';
import { getSyncMetadata } from '#src/services/api/sync.js';
import { IS_PREVIEW } from '#src/services/config.js';
import { logAndFormatError } from '#src/services/error-formatter.js';
import { trpc, trpcSubscriptionEvents } from '#src/services/trpc.js';

import { useProjects } from './use-projects.js';

const INITIAL_SYNC_METADATA: SyncMetadata = {
  status: 'not-started',
  packages: {},
};

const useSyncMetadataStore = create<{
  metadata: SyncMetadata;
  setMetadata: (metadata: SyncMetadata) => void;
}>((set) => ({
  metadata: INITIAL_SYNC_METADATA,
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
    setMetadata(INITIAL_SYNC_METADATA);
    if (!currentProjectId) {
      return;
    }

    let cancelled = false;

    const fetchSyncMetadata = (): void => {
      getSyncMetadata(currentProjectId)
        .then((metadata) => {
          if (cancelled) {
            return;
          }
          setMetadata(metadata);
        })
        .catch((error: unknown) => {
          if (error instanceof ProjectNotFoundError) {
            // Ignore project not found error since the user will be given a
            // chance to select a different project
            return;
          }
          toast.error(
            logAndFormatError(error, 'Failed to fetch sync metadata.'),
          );
        });
    };

    fetchSyncMetadata();

    if (IS_PREVIEW) {
      return;
    }

    const unsubscribeFromWebsocket = trpcSubscriptionEvents.on(
      'open',
      fetchSyncMetadata,
    );

    const subscription = trpc.sync.onSyncMetadataChanged.subscribe(
      { id: currentProjectId },
      {
        onData: (data) => {
          setMetadata(data.syncMetadata);
        },
      },
    );
    const syncCompletedSubscription = trpc.sync.onSyncCompleted.subscribe(
      { id: currentProjectId },
      {
        onData: (data) => {
          const { status } = data.syncMetadata;

          const hasConflicts = Object.values(data.syncMetadata.packages).some(
            (packageInfo) => packageInfo.status === 'conflicts',
          );

          if (hasConflicts) {
            toast.warning('Sync completed with conflicts! Please review.');
          } else if (status === 'success') {
            toast.success('Sync completed successfully!');
          } else if (status === 'error') {
            toast.error('Sync failed with errors!');
          }
        },
      },
    );
    return () => {
      subscription.unsubscribe();
      syncCompletedSubscription.unsubscribe();
      unsubscribeFromWebsocket();
      cancelled = true;
    };
  }, [currentProjectId, setMetadata]);
}

/**
 * This hook is used to get the sync metadata.
 */
export function useSyncMetadata<T = SyncMetadata>(
  selector?: (metadata: SyncMetadata) => T,
): T {
  return useSyncMetadataStore(
    useShallow((state) =>
      selector ? selector(state.metadata) : (state.metadata as T),
    ),
  );
}
