import { Button, Dialog } from '@halfdomelabs/ui-components';
import classNames from 'classnames';
import { useState } from 'react';
import { MdSync } from 'react-icons/md';
import Console from 'src/components/Console';
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

  const startSyncProject = (): void => {
    if (!projectId) {
      return;
    }
    startSync(projectId).catch((err) => toast.error(formatError(err)));
    setIsOpen(true);
  };

  return (
    <div className={classNames('', className)}>
      <Button
        variant="primary"
        iconBefore={MdSync}
        onClick={() => {
          startSyncProject();
        }}
      >
        Sync
      </Button>
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} size="xl">
        <Dialog.Header onClose={() => setIsOpen(false)}>
          Sync Project
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
