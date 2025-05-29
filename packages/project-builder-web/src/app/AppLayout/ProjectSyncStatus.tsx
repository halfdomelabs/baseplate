import type React from 'react';

import clsx from 'clsx';
import TimeAgo from 'react-timeago';

import { useSyncMetadata } from '#src/hooks/useSyncMetadata.js';
import { timeAgoFormatter } from '#src/utils/time-ago.js';

interface ProjectSyncStatusProps {
  className?: string;
}

export function ProjectSyncStatus({
  className,
}: ProjectSyncStatusProps): React.JSX.Element | null {
  const completedAt = useSyncMetadata((metadata) => metadata.completedAt);

  if (!completedAt) {
    return null;
  }

  return (
    <div className={clsx('text-style-muted', className)}>
      Last Sync: <TimeAgo date={completedAt} formatter={timeAgoFormatter} />
    </div>
  );
}
