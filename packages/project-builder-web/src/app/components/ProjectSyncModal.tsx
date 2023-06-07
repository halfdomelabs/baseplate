import { Button } from '@halfdomelabs/ui-components';
import classNames from 'classnames';
import { useState } from 'react';
import { MdSync } from 'react-icons/md';
import Console from 'src/components/Console';
import Modal from 'src/components/Modal';
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
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <Modal.Header>Sync Project</Modal.Header>
        <Modal.Body>
          <Console />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={startSyncProject}>
            Retry
          </Button>
          <Button variant="secondary" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ProjectSyncModal;
