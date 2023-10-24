import { Button, Dialog } from '@halfdomelabs/ui-components';
import classNames from 'classnames';
import { useState } from 'react';
import { MdSync } from 'react-icons/md';
import Console from 'src/components/Console';
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
      startSync(projectId).catch((err) => toast.error(formatError(err)));
    }, 300);
    setIsOpen(true);
  };

  return (
    <div className={classNames('', className)}>
      <Button
        onClick={() => {
          startSyncProject();
        }}
      >
        <Button.Icon icon={MdSync} />
        Sync
      </Button>
      <Dialog isOpen={isOpen} onOpenChange={() => setIsOpen(false)} size="xl">
        <Dialog.Header>
          <Dialog.Title>Sync Project</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Console />
        </Dialog.Body>
        <Dialog.Footer>
          <Button variant="secondary" onClick={startSyncProject}>
            Retry
          </Button>
          <Button variant="secondary" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </Dialog.Footer>
      </Dialog>
    </div>
  );
}

export default ProjectSyncModal;
