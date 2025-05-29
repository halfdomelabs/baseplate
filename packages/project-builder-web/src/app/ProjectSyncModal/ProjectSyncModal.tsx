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
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import { MdSync, MdSyncProblem } from 'react-icons/md';

import { Console } from '#src/components/index.js';
import { useProjects } from '#src/hooks/useProjects.js';
import { useSyncMetadata } from '#src/hooks/useSyncMetadata.js';
import { cancelSync, startSync } from '#src/services/api/index.js';
import {
  formatError,
  logAndFormatError,
} from '#src/services/error-formatter.js';

import { PackageSyncStatus } from './PackageSyncStatus.js';

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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="packages">Packages</TabsTrigger>
              <TabsTrigger value="console-log">Console log</TabsTrigger>
            </TabsList>
            <TabsContent value="packages" className="mt-4">
              <PackageSyncStatus />
            </TabsContent>
            <TabsContent value="console-log" className="mt-4">
              <Console />
            </TabsContent>
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
