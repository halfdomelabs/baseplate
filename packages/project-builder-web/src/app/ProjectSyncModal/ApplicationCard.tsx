import type {
  FileWithConflict,
  PackageSyncInfo,
} from '@halfdomelabs/project-builder-server';
import type React from 'react';

import {
  Badge,
  Button,
  Table,
  toast,
  Tooltip,
} from '@halfdomelabs/ui-components';
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

function getConflictTypeLabel(type: FileWithConflict['conflictType']): string {
  switch (type) {
    case 'merge-conflict': {
      return 'Merge Conflict';
    }
    case 'working-deleted': {
      return 'Deleted by User';
    }
    case 'generated-deleted': {
      return 'Deleted in Generated';
    }
    default: {
      return 'Unknown';
    }
  }
}

function getConflictTypeTooltip(
  type: FileWithConflict['conflictType'],
): string {
  switch (type) {
    case 'merge-conflict': {
      return 'This file was modified in both the working codebase and the generated codebase. Please resolve the conflicts manually.';
    }
    case 'working-deleted': {
      return 'This file was deleted in the working codebase but modified in the generated codebase. Choose whether to keep or delete it.';
    }
    case 'generated-deleted': {
      return 'This file was deleted in the generated codebase but modified in the working codebase. Choose whether to keep or delete it.';
    }
    default: {
      return 'Unknown conflict type';
    }
  }
}

function FilesWithConflictsView({
  packageId,
  filesWithConflicts,
}: {
  packageId: string;
  filesWithConflicts: FileWithConflict[];
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

  const handleKeepFile = (file: FileWithConflict): void => {
    if (!currentProjectId) return;
    trpc.sync.keepConflictFile
      .mutate({
        id: currentProjectId,
        packageId,
        relativePath: file.relativePath,
      })
      .then(() => {
        toast.success(`File ${file.relativePath} was kept!`);
      })
      .catch((err: unknown) => {
        toast.error(logAndFormatError(err, 'Failed to keep file'));
      });
  };
  const handleDeleteFile = (file: FileWithConflict): void => {
    if (!currentProjectId) return;
    trpc.sync.deleteConflictFile
      .mutate({
        id: currentProjectId,
        packageId,
        relativePath: file.relativePath,
      })
      .then(() => {
        toast.success(`File ${file.relativePath} was deleted!`);
      })
      .catch((err: unknown) => {
        toast.error(logAndFormatError(err, 'Failed to delete file'));
      });
  };

  return (
    <div>
      <h4 className="font-medium">Merge Conflicts</h4>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.Head className="w-3/5">Name</Table.Head>
            <Table.Head className="w-1/5">
              <div className="flex items-center gap-2">Type</div>
            </Table.Head>
            <Table.Head className="w-1/5">Actions</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {filesWithConflicts.map((file) => (
            <Table.Row key={file.relativePath}>
              <Table.Cell>
                {clientVersion.userConfig.sync?.editor ? (
                  <button
                    className="hover:underline"
                    onClick={() => {
                      handleOpenEditor(
                        file.generatedConflictRelativePath ?? file.relativePath,
                      );
                    }}
                  >
                    <div className="w-full text-start">
                      {file.generatedConflictRelativePath ?? file.relativePath}
                    </div>
                  </button>
                ) : (
                  <span>
                    {file.generatedConflictRelativePath ?? file.relativePath}
                  </span>
                )}
              </Table.Cell>
              <Table.Cell>
                <Tooltip>
                  <Tooltip.Trigger>
                    <span>{getConflictTypeLabel(file.conflictType)}</span>
                  </Tooltip.Trigger>
                  <Tooltip.Content side="left" className="max-w-sm">
                    {getConflictTypeTooltip(file.conflictType)}
                  </Tooltip.Content>
                </Tooltip>
              </Table.Cell>
              <Table.Cell>
                {file.conflictType === 'merge-conflict' &&
                  clientVersion.userConfig.sync?.editor && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleOpenEditor(
                          file.generatedConflictRelativePath ??
                            file.relativePath,
                        );
                      }}
                    >
                      View
                    </Button>
                  )}
                {file.conflictType !== 'merge-conflict' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleKeepFile(file);
                      }}
                    >
                      Keep
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        handleDeleteFile(file);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
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
        <div className="space-y-4 border-t p-4">
          {packageInfo.result?.errors &&
            packageInfo.result.errors.length > 0 && (
              <div className="mt-2 space-y-1">
                <h4 className="font-medium">Errors:</h4>
                <ul className="list-disc pl-5 text-sm text-destructive">
                  {packageInfo.result.errors.map((err, index) => (
                    <li key={index} className="whitespace-pre-wrap font-mono">
                      {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          <FilesWithConflictsView
            packageId={packageId}
            filesWithConflicts={filesWithConflicts}
          />
          {packageInfo.result?.failedCommands &&
            packageInfo.result.failedCommands.length > 0 && (
              <div className="mt-2 space-y-1">
                <h4 className="font-medium">Failed Commands:</h4>
                <ul className="list-disc pl-5 text-sm text-destructive">
                  {packageInfo.result.failedCommands.map((cmd, index) => (
                    <li key={index}>
                      <code>{cmd.command}</code>
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
