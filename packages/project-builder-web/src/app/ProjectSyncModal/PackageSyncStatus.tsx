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

  if (metadata.globalErrors?.length) {
    return (
      <Alert variant="error">
        <Alert.Title>Error compiling project.</Alert.Title>
        <Alert.Description>
          {metadata.globalErrors.map((error) => (
            <div key={error} className="font-mono whitespace-pre-wrap">
              {error}
            </div>
          ))}
        </Alert.Description>
      </Alert>
    );
  }

  const hasPackages = Object.keys(metadata.packages).length > 0;
  if (!hasPackages) {
    return metadata.status === 'not-started' ||
      metadata.status === 'in-progress' ? (
      <div
        className={clsx(
          'flex h-40 items-center justify-center text-muted-foreground',
          className,
        )}
      >
        <span>Waiting for sync to start...</span>
      </div>
    ) : (
      <Alert variant="default">
        <Alert.Title>No packages found to be synced.</Alert.Title>
        <Alert.Description>
          Sync status will appear here once packages have been added.
        </Alert.Description>
      </Alert>
    );
  }

  const packageEntries = Object.entries(metadata.packages);

  const sortedPackageEntries = sortBy(packageEntries, [
    ([, packageInfo]) => packageInfo.order,
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
