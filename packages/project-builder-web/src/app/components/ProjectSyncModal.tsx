import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { Button, Dialog } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import { MdSync } from 'react-icons/md';

import { useProjects } from '@src/hooks/useProjects';
import Console, { ConsoleRef } from 'src/components/Console';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';
import { startSync } from 'src/services/remote';

interface Props {
  className?: string;
}

function ProjectSyncModal({ className }: Props): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const clearConsoleRef = useRef<ConsoleRef>(null);
  const toast = useToast();
  const { definition, setConfig } = useProjectDefinition();
  const { currentProjectId, setLastSyncedAt } = useProjects();

  const startSyncProject = (): void => {
    setLastSyncedAt(new Date());
    if (!currentProjectId) {
      return;
    }
    // save config when syncing to ensure any migrations/cli versions are set
    setConfig(definition);
    // TODO: this is a hack to ensure we don't attempt to read from the file while we write to it

    setTimeout(() => {
      clearConsoleRef.current?.clearConsole();
      startSync(currentProjectId).catch((err) => toast.error(formatError(err)));
    }, 300);
    setIsOpen(true);
  };

  return (
    <div className={clsx(className)}>
      <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
        <Dialog.Trigger asChild>
          <Button
            onClick={() => {
              startSyncProject();
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
