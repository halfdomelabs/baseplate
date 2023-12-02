import { Button, Dialog } from '@halfdomelabs/ui-components';
import classNames from 'classnames';
import { useRef, useState } from 'react';
import { MdSync } from 'react-icons/md';

import Console, { ConsoleRef } from 'src/components/Console';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useProjectIdState } from 'src/hooks/useProjectIdState';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';
import { startSync } from 'src/services/remote';

interface Props {
  className?: string;
}

function ProjectSyncModal({ className }: Props): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [projectId] = useProjectIdState();
  const clearConsoleRef = useRef<ConsoleRef>(null);
  const toast = useToast();
  const { config, setConfig } = useProjectConfig();

  const startSyncProject = (): void => {
    if (!projectId) {
      return;
    }
    // save config when syncing to ensure any migrations/cli versions are set
    setConfig(config);
    // TODO: this is a hack to ensure we don't attempt to read from the file while we write to it

    setTimeout(() => {
      clearConsoleRef.current?.clearConsole();
      startSync(projectId).catch((err) => toast.error(formatError(err)));
    }, 300);
    setIsOpen(true);
  };

  return (
    <div className={classNames('', className)}>
      <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
        <Dialog.Trigger asChild>
          <Button
            onClick={() => {
              startSyncProject();
            }}
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
