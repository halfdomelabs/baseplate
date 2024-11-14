import type React from 'react';

import clsx from 'clsx';
import ReactTimeAgo from 'react-time-ago';

import { useProjects } from '@src/hooks/useProjects';
import { initializeTimeAgo } from '@src/utils/time-ago';

interface ProjectSyncStatusProps {
  className?: string;
}

initializeTimeAgo();

export function ProjectSyncStatus({
  className,
}: ProjectSyncStatusProps): React.JSX.Element | null {
  const lastSyncedAt = useProjects((store) => store.lastSyncedAt);

  if (!lastSyncedAt) {
    return null;
  }

  return (
    <div className={clsx('text-style-muted', className)}>
      Last Sync: <ReactTimeAgo date={lastSyncedAt} />
    </div>
  );
}
