import type { ReactElement } from 'react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  JsonDiffViewer,
} from '@baseplate-dev/ui-components';

import type { DefinitionDiff, DefinitionDiffEntry } from '#src/tools/index.js';

const CHANGE_TYPE_BADGE_VARIANT = {
  added: 'default',
  updated: 'secondary',
  removed: 'destructive',
} as const;

interface DefinitionDiffEntryRowProps {
  entry: DefinitionDiffEntry;
}

function DefinitionDiffEntryRow({
  entry,
}: DefinitionDiffEntryRowProps): ReactElement {
  return (
    <div className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm">
      <span className="font-medium">{entry.label}</span>
      <div className="flex items-center gap-2">
        <Badge variant={CHANGE_TYPE_BADGE_VARIANT[entry.type]}>
          {entry.type}
        </Badge>
        <Dialog>
          <DialogTrigger render={<Button variant="ghost" size="sm" />}>
            Details
          </DialogTrigger>
          <DialogContent width="xl">
            <DialogHeader>
              <DialogTitle>
                {entry.label} — {entry.type}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-auto">
              {entry.type === 'added' ? (
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(entry.merged, null, 2)}
                </pre>
              ) : entry.type === 'removed' ? (
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(entry.current, null, 2)}
                </pre>
              ) : (
                <JsonDiffViewer
                  oldValue={entry.current}
                  newValue={entry.merged}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

interface DefinitionDiffAlertProps {
  diff: DefinitionDiff;
  upToDateMessage?: string;
}

export function DefinitionDiffAlert({
  diff,
  upToDateMessage = 'All changes are up to date. No changes needed.',
}: DefinitionDiffAlertProps): ReactElement {
  if (!diff.hasChanges) {
    return (
      <Alert variant="default">
        <AlertTitle>Up to Date</AlertTitle>
        <AlertDescription>{upToDateMessage}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Alert variant="warning">
        <AlertTitle>Pending Changes</AlertTitle>
        <AlertDescription>
          The following changes will be applied when you save:
        </AlertDescription>
      </Alert>
      <div className="space-y-1">
        {diff.entries.map((entry) => (
          <DefinitionDiffEntryRow
            key={`${entry.path}-${entry.label}`}
            entry={entry}
          />
        ))}
      </div>
    </div>
  );
}
