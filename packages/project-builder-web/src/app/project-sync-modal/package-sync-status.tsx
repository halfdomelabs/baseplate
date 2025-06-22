import type React from 'react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@baseplate-dev/ui-components';
import clsx from 'clsx';
import { sortBy } from 'es-toolkit';

import { useSyncMetadata } from '#src/hooks/use-sync-metadata.js';

import { ApplicationCard } from './application-card.js';

interface Props {
  className?: string;
}

export function PackageSyncStatus({ className }: Props): React.JSX.Element {
  const metadata = useSyncMetadata();

  if (metadata.globalErrors?.length) {
    return (
      <Alert variant="error">
        <AlertTitle>Error compiling project.</AlertTitle>
        <AlertDescription>
          {metadata.globalErrors.map((error) => (
            <div key={error} className="font-mono whitespace-pre-wrap">
              {error}
            </div>
          ))}
        </AlertDescription>
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
        <AlertTitle>No packages found to be synced.</AlertTitle>
        <AlertDescription>
          Sync status will appear here once packages have been added.
        </AlertDescription>
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
