import type React from 'react';
import type { ConsoleRef } from 'src/components/Console';

import {
  useBlockBeforeContinue,
  useProjectDefinition,
} from '@halfdomelabs/project-builder-lib/web';
import { Button, Dialog, toast } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import { MdSync } from 'react-icons/md';
import Console from 'src/components/Console';
import { startSync } from 'src/services/api';
import { formatError } from 'src/services/error-formatter';

import { useProjects } from '@src/hooks/useProjects';

interface Props {
  className?: string;
}

function ProjectSyncModal({ className }: Props): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const clearConsoleRef = useRef<ConsoleRef>(null);
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

    clearConsoleRef.current?.clearConsole();
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
        <Dialog.Content width="lg">
          <Dialog.Header>
            <Dialog.Title>Sync Project</Dialog.Title>
            <Dialog.Description>
              Syncing your project will update the project with the latest
              changes.
            </Dialog.Description>
          </Dialog.Header>
          <Console ref={clearConsoleRef} />
          <Dialog.Footer>
            <Button variant="secondary" onClick={startSyncProject}>
              Retry
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setIsOpen(false);
              }}
            >
              Close
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}

export default ProjectSyncModal;
