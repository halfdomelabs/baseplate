import type { PackageSyncInfo } from '@halfdomelabs/project-builder-server';
import type React from 'react';

import { Badge } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import {
  MdCancel,
  MdCheckCircle,
  MdError,
  MdHourglassEmpty,
  MdSync,
  MdSyncProblem,
} from 'react-icons/md';
import TimeAgo from 'react-timeago';

import { timeAgoFormatter } from '@src/utils/time-ago';

interface Props {
  packageInfo: PackageSyncInfo;
  className?: string;
}

function getStatusIcon(status: PackageSyncInfo['status']): React.JSX.Element {
  switch (status) {
    case 'success': {
      return <MdCheckCircle className="text-success-foreground" />;
    }
    case 'unknown-error':
    case 'command-error': {
      return <MdError className="text-error-foreground" />;
    }
    case 'conflicts': {
      return <MdSyncProblem className="text-warning-foreground" />;
    }
    case 'cancelled': {
      return <MdCancel className="text-secondary-foreground" />;
    }
    case 'not-synced': {
      return <MdHourglassEmpty className="text-secondary-foreground" />;
    }
    case 'in-progress': {
      return <MdSync className="text-secondary-foreground" />;
    }
    default: {
      return <MdHourglassEmpty className="text-secondary-foreground" />;
    }
  }
}

function getStatusLabel(status: PackageSyncInfo['status']): string {
  switch (status) {
    case 'success': {
      return 'Synced';
    }
    case 'unknown-error': {
      return 'Sync error';
    }
    case 'command-error': {
      return 'Command error';
    }
    case 'conflicts': {
      return 'Conflicts';
    }
    case 'cancelled': {
      return 'Cancelled';
    }
    case 'not-synced': {
      return 'Not Synced';
    }
    case 'in-progress': {
      return 'Syncing...';
    }
    default: {
      return 'Unknown';
    }
  }
}

export function ApplicationCard({
  packageInfo,
  className,
}: Props): React.JSX.Element {
  const syncHasErrors =
    packageInfo.status === 'unknown-error' ||
    packageInfo.status === 'command-error' ||
    packageInfo.status === 'conflicts';
  return (
    <div className={clsx('w-full rounded-md border', className)}>
      <div className="flex w-full items-center justify-between px-4 py-3">
        <span className="font-medium">{packageInfo.name}</span>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {packageInfo.result?.completedAt ? (
              <TimeAgo
                date={new Date(packageInfo.result.completedAt)}
                formatter={timeAgoFormatter}
              />
            ) : (
              '-'
            )}
          </span>
          <Badge
            variant={
              packageInfo.status === 'unknown-error' ||
              packageInfo.status === 'command-error'
                ? 'destructive'
                : 'secondary'
            }
            className="flex items-center gap-1"
          >
            {getStatusIcon(packageInfo.status)}
            {getStatusLabel(packageInfo.status)}
          </Badge>
        </div>
      </div>
      {syncHasErrors && (
        <div className="border-t px-4 pb-4 pt-2">
          {packageInfo.result?.errors &&
            packageInfo.result.errors.length > 0 && (
              <div className="mt-2 space-y-1">
                <h4 className="font-medium">Errors:</h4>
                <ul className="list-disc pl-5 text-sm text-destructive">
                  {packageInfo.result.errors.map((err, index) => (
                    <li key={index}>{err.message}</li>
                  ))}
                </ul>
              </div>
            )}
          {packageInfo.result?.failedCommands &&
            packageInfo.result.failedCommands.length > 0 && (
              <div className="mt-2 space-y-1">
                <h4 className="font-medium">Failed Commands:</h4>
                <ul className="list-disc pl-5 text-sm text-destructive">
                  {packageInfo.result.failedCommands.map((cmd, index) => (
                    <li key={index}>
                      <code>{cmd.command}</code> in{' '}
                      <code>{cmd.workingDir ?? '.'}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          {packageInfo.result?.filesWithConflicts &&
            packageInfo.result.filesWithConflicts.length > 0 && (
              <div className="mt-2 space-y-1">
                <h4 className="font-medium">Files with Conflicts:</h4>
                <ul className="list-disc pl-5 text-sm text-warning-foreground">
                  {packageInfo.result.filesWithConflicts.map((file, index) => (
                    <li key={index}>
                      {file.relativePath}{' '}
                      {file.resolved ? '(Resolved)' : '(Unresolved)'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          {packageInfo.result?.filesPendingDelete &&
            packageInfo.result.filesPendingDelete.length > 0 && (
              <div className="mt-2 space-y-1">
                <h4 className="font-medium">Files Pending Delete:</h4>
                <ul className="list-disc pl-5 text-sm text-warning-foreground">
                  {packageInfo.result.filesPendingDelete.map((file, index) => (
                    <li key={index}>
                      {file.relativePath}{' '}
                      {file.resolved ? '(Resolved)' : '(Unresolved)'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
