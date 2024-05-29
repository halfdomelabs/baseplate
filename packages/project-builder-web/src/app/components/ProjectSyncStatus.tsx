import clsx from 'clsx';
import ReactTimeAgo from 'react-time-ago';

import { useSyncStatusStore } from '@src/hooks/useSyncStatus';
import { initializeTimeAgo } from '@src/utils/time-ago';

interface ProjectSyncStatusProps {
  className?: string;
}

initializeTimeAgo();

export function ProjectSyncStatus({
  className,
}: ProjectSyncStatusProps): JSX.Element | null {
  const store = useSyncStatusStore();

  if (!store.lastSyncedAt) {
    return null;
  }

  return (
    <div className={clsx('text-style-muted', className)}>
      Last Sync: <ReactTimeAgo date={store.lastSyncedAt} />
    </div>
  );
}
