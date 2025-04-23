import type {
  FileWithConflict,
  PackageSyncInfo,
} from '@halfdomelabs/project-builder-server';
import type React from 'react';

import { Badge, toast, Tooltip } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import {
  MdCancel,
  MdCheckCircle,
  MdError,
  MdHourglassEmpty,
  MdInfo,
  MdSync,
  MdSyncProblem,
} from 'react-icons/md';
import TimeAgo from 'react-timeago';

import { useClientVersion } from '@src/hooks/useClientVersion';
import { useProjects } from '@src/hooks/useProjects';
import { logAndFormatError } from '@src/services/error-formatter';
import { trpc } from '@src/services/trpc';
import { timeAgoFormatter } from '@src/utils/time-ago';

interface Props {
  packageId: string;
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

function FilesWithConflictsView({
  packageId,
  filesWithConflicts,
  title,
  tooltip,
}: {
  packageId: string;
  filesWithConflicts: FileWithConflict[];
  title: string;
  tooltip: string;
}): React.JSX.Element | null {
  const clientVersion = useClientVersion();
  const { currentProjectId } = useProjects();

  if (filesWithConflicts.length === 0) {
    return null;
  }

  const handleOpenEditor = (relativePath: string): void => {
    if (!currentProjectId) return;
    trpc.sync.openEditor
      .mutate({
        id: currentProjectId,
        packageId,
        relativePath,
      })
      .catch((err: unknown) => {
        toast.error(logAndFormatError(err, 'Failed to open editor'));
      });
  };

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-2">
        <h4 className="font-medium">{title}</h4>
        <Tooltip>
          <Tooltip.Trigger>
            <MdInfo className="text-muted-foreground" />
          </Tooltip.Trigger>
          <Tooltip.Content side="right" className="max-w-sm">
            {tooltip}
          </Tooltip.Content>
        </Tooltip>
      </div>
      <ul className="list-disc pl-5 text-sm">
        {filesWithConflicts.map((file, index) => (
          <li key={index} className="text-sm text-warning-foreground">
            {clientVersion.userConfig.sync?.editor ? (
              <button
                className="hover:underline"
                onClick={() => {
                  handleOpenEditor(
                    file.generatedConflictRelativePath ?? file.relativePath,
                  );
                }}
              >
                {file.generatedConflictRelativePath ?? file.relativePath}
              </button>
            ) : (
              <span>
                {file.generatedConflictRelativePath ?? file.relativePath}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ApplicationCard({
  packageId,
  packageInfo,
  className,
}: Props): React.JSX.Element {
  const syncHasErrors =
    packageInfo.status === 'unknown-error' ||
    packageInfo.status === 'command-error' ||
    packageInfo.status === 'conflicts';

  const filesWithConflicts = packageInfo.result?.filesWithConflicts ?? [];

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
          <FilesWithConflictsView
            packageId={packageId}
            filesWithConflicts={filesWithConflicts.filter(
              (f) => f.conflictType === 'merge-conflict',
            )}
            title="Files with merge conflicts:"
            tooltip="These files were modified in both the working codebase and the generated codebase. Please resolve the conflicts manually."
          />
          <FilesWithConflictsView
            packageId={packageId}
            filesWithConflicts={filesWithConflicts.filter(
              (f) => f.conflictType === 'generated-deleted',
            )}
            title="Deleted files that were modified by user:"
            tooltip="Review whether these files should be deleted or not."
          />
          <FilesWithConflictsView
            packageId={packageId}
            filesWithConflicts={filesWithConflicts.filter(
              (f) => f.conflictType === 'working-deleted',
            )}
            title="Files deleted by user that were modified by Baseplate:"
            tooltip="Review whether these files should be deleted or not."
          />
        </div>
      )}
    </div>
  );
}
