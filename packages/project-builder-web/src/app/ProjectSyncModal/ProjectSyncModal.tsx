import type React from 'react';

import {
  useBlockBeforeContinue,
  useProjectDefinition,
} from '@halfdomelabs/project-builder-lib/web';
import { Button, Dialog, Tabs, toast } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import { MdSync } from 'react-icons/md';

import { Console } from '@src/components';
import { useProjects } from '@src/hooks/useProjects';
import { startSync } from '@src/services/api';
import { formatError } from '@src/services/error-formatter';

import { PackageSyncStatus } from './PackageSyncStatus';

interface Props {
  className?: string;
}

function ProjectSyncModal({ className }: Props): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const { definitionContainer } = useProjectDefinition();
  const { currentProjectId, setLastSyncedAt } = useProjects();
  const blockBeforeContinue = useBlockBeforeContinue();

  const definitionContainerRef = useRef(definitionContainer);
  definitionContainerRef.current = definitionContainer;

  const startSyncProject = (): void => {
    setLastSyncedAt(new Date());
    if (!currentProjectId) {
      return;
    }

    startSync(currentProjectId).catch((error: unknown) =>
      toast.error(formatError(error)),
    );
    setIsOpen(true);
  };

  return (
    <div className={clsx(className)}>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
        }}
      >
        <Dialog.Trigger asChild>
          <Button
            onClick={(e) => {
              blockBeforeContinue({
                onContinue: startSyncProject,
              });
              e.preventDefault();
            }}
            size="sm"
          >
            <Button.Icon icon={MdSync} />
            Sync
          </Button>
        </Dialog.Trigger>
        <Dialog.Content width="lg" aria-description="Sync project dialog">
          <Dialog.Header>
            <Dialog.Title>Sync Project</Dialog.Title>
            <Dialog.Description>
              Sync the project configuration to the codebase of your project.
            </Dialog.Description>
          </Dialog.Header>
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
          <Dialog.Footer>
            <Button variant="secondary" onClick={startSyncProject}>
              Retry
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
              }}
            >
              Cancel
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}

export default ProjectSyncModal;
