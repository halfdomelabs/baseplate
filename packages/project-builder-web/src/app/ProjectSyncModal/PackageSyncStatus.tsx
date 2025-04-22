import type { SyncMetadata } from '@halfdomelabs/project-builder-server';
import type React from 'react';

import { Alert, toast } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

import { useProjects } from '@src/hooks/useProjects';
import { getSyncMetadata } from '@src/services/api';
import { logAndFormatError } from '@src/services/error-formatter';
import { trpc } from '@src/services/trpc';

import { ApplicationCard } from './ApplicationCard';

interface Props {
  className?: string;
}

export function PackageSyncStatus({ className }: Props): React.JSX.Element {
  const { currentProjectId } = useProjects();
  const [metadata, setMetadata] = useState<SyncMetadata | undefined>(undefined);

  useEffect(() => {
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
  }, [currentProjectId]);

  // Handle loading state
  if (!metadata) {
    return (
      <div
        className={clsx(
          'flex h-40 items-center justify-center text-muted-foreground',
          className,
        )}
      >
        <span>Loading sync status...</span>
      </div>
    );
  }

  const packageEntries = Object.entries(metadata.packages);

  if (packageEntries.length === 0) {
    return (
      <Alert variant="default">
        <Alert.Title>No packages found to be synced.</Alert.Title>
        <Alert.Description>
          Sync status will appear here once packages have been added.
        </Alert.Description>
      </Alert>
    );
  }

  return (
    <div className={clsx('space-y-3', className)}>
      {packageEntries.map(([packageName, packageInfo]) => (
        <ApplicationCard key={packageName} packageInfo={packageInfo} />
      ))}
    </div>
  );
}
