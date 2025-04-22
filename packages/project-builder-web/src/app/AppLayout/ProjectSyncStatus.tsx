import type React from 'react';

import clsx from 'clsx';
import TimeAgo from 'react-timeago';

import { useProjects } from '@src/hooks/useProjects';

interface ProjectSyncStatusProps {
  className?: string;
}

export function ProjectSyncStatus({
  className,
}: ProjectSyncStatusProps): React.JSX.Element | null {
  const lastSyncedAt = useProjects((store) => store.lastSyncedAt);

  if (!lastSyncedAt) {
    return null;
  }

  return (
    <div className={clsx('text-style-muted', className)}>
      Last Sync: <TimeAgo date={lastSyncedAt} />
    </div>
  );
}
