import type React from 'react';

import {
  useBlockBeforeContinue,
  useProjectDefinition,
} from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Tabs,
  toast,
} from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import { MdSync, MdSyncProblem } from 'react-icons/md';

import { Console } from '@src/components';
import { useProjects } from '@src/hooks/useProjects';
import { useSyncMetadata } from '@src/hooks/useSyncMetadata';
import { cancelSync, startSync } from '@src/services/api';
import { formatError, logAndFormatError } from '@src/services/error-formatter';

import { PackageSyncStatus } from './PackageSyncStatus';

interface Props {
  className?: string;
}

function ProjectSyncModal({ className }: Props): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const { definitionContainer } = useProjectDefinition();
  const { currentProjectId } = useProjects();
  const blockBeforeContinue = useBlockBeforeContinue();

  const definitionContainerRef = useRef(definitionContainer);
  definitionContainerRef.current = definitionContainer;

  const isSyncing = useSyncMetadata(
    (metadata) => metadata.status === 'in-progress',
  );
  const hasConflicts = useSyncMetadata((metadata) =>
    Object.values(metadata.packages).some((p) => p.status === 'conflicts'),
  );

  const startSyncProject = (): void => {
    if (!currentProjectId) {
      return;
    }

    if (hasConflicts) {
      toast.warning('Conflicts must be resolved before syncing');
      return;
    }

    startSync(currentProjectId).catch((error: unknown) =>
      toast.error(logAndFormatError(error)),
    );
    setIsOpen(true);
  };

  const cancelSyncProject = (): void => {
    if (!currentProjectId) {
      return;
    }

    cancelSync(currentProjectId).catch((error: unknown) =>
      toast.error(formatError(error)),
    );
  };

  return (
    <div className={clsx(className)}>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
        }}
      >
        <DialogTrigger asChild>
          <Button
            onClick={(e) => {
              setIsOpen(true);
              if (!isSyncing && !hasConflicts) {
                blockBeforeContinue({
                  onContinue: startSyncProject,
                });
                e.preventDefault();
              }
            }}
            size="sm"
            data-testid="sync-button"
          >
            {hasConflicts ? <MdSyncProblem /> : <MdSync />}
            {isSyncing
              ? 'Syncing...'
              : hasConflicts
                ? 'Resolve conflicts'
                : 'Sync'}
          </Button>
        </DialogTrigger>
        <DialogContent width="lg" aria-description="Sync project dialog">
          <DialogHeader>
            <DialogTitle>Sync Project</DialogTitle>
            <DialogDescription>
              Sync the project configuration to the codebase of your project.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="packages" className="mt-4 min-w-0">
            <Tabs.List className="grid w-full grid-cols-2">
              <Tabs.Trigger value="packages">Packages</Tabs.Trigger>
              <Tabs.Trigger value="console-log">Console log</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="packages" className="mt-4">
              <PackageSyncStatus />
            </Tabs.Content>
            <Tabs.Content value="console-log" className="mt-4">
              <Console />
            </Tabs.Content>
          </Tabs>
          <DialogFooter>
            {isSyncing ? (
              <Button variant="destructive" onClick={cancelSyncProject}>
                Stop
              </Button>
            ) : (
              <Button variant="secondary" onClick={startSyncProject}>
                Sync Again
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProjectSyncModal;
