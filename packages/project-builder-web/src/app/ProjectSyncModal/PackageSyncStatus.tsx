import type React from 'react';

import { Alert } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { sortBy } from 'es-toolkit';

import { useSyncMetadata } from '@src/hooks/useSyncMetadata';

import { ApplicationCard } from './ApplicationCard';

interface Props {
  className?: string;
}

export function PackageSyncStatus({ className }: Props): React.JSX.Element {
  const metadata = useSyncMetadata();

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

  const sortedPackageEntries = sortBy(packageEntries, [
    ([, packageInfo]) => packageInfo.name,
  ]);

  return (
    <div className={clsx('space-y-3', className)}>
      {sortedPackageEntries.map(([packageId, packageInfo]) => (
        <ApplicationCard
          key={packageId}
          packageId={packageId}
          packageInfo={packageInfo}
        />
      ))}
    </div>
  );
}
