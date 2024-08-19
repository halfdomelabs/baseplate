import {
  useBlockBeforeContinue,
  useProjectDefinition,
} from '@halfdomelabs/project-builder-lib/web';
import { Button, Dialog } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import { MdSync } from 'react-icons/md';

import { useProjects } from '@src/hooks/useProjects';
import { useRemoteProjectDefinition } from '@src/hooks/useRemoteProjectDefinition';
import { prettyStableStringify } from '@src/utils/json';
import Console, { ConsoleRef } from 'src/components/Console';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';
import { FilePayload, startSync } from 'src/services/remote';

interface Props {
  className?: string;
}

function ProjectSyncModal({ className }: Props): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const clearConsoleRef = useRef<ConsoleRef>(null);
  const toast = useToast();
  const { definitionContainer } = useProjectDefinition();
  const { lastModifiedAt } = useRemoteProjectDefinition();
  const { currentProjectId, setLastSyncedAt } = useProjects();
  const blockBeforeContinue = useBlockBeforeContinue();

  const definitionContainerRef = useRef(definitionContainer);
  definitionContainerRef.current = definitionContainer;

  const startSyncProject = (): void => {
    setLastSyncedAt(new Date());
    if (!currentProjectId) {
      return;
    }
    const serializedConfig = prettyStableStringify(
      definitionContainerRef.current.toSerializedConfig(),
    );
    const payload: FilePayload = {
      contents: serializedConfig,
      lastModifiedAt: lastModifiedAt ?? new Date(0).toISOString(),
    };

    clearConsoleRef.current?.clearConsole();
    startSync(currentProjectId, payload).catch((err) =>
      toast.error(formatError(err)),
    );
    setIsOpen(true);
  };

  return (
    <div className={clsx(className)}>
      <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
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
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}

export default ProjectSyncModal;
