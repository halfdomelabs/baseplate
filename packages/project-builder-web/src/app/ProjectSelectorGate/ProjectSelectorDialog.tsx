import type React from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Table,
} from '@halfdomelabs/ui-components';
import { useNavigate } from 'react-router-dom';

import { useProjects } from '@src/hooks/useProjects';

interface ProjectSelectDialogProps {
  onClose?: () => void;
  isOpen?: boolean;
}

export function ProjectSelectDialog({
  onClose,
  isOpen,
}: ProjectSelectDialogProps): React.JSX.Element {
  const { currentProjectId, setCurrentProjectId, projects } = useProjects();
  const navigate = useNavigate();

  return (
    <Dialog
      onOpenChange={
        onClose ??
        (() => {
          /* no-op */
        })
      }
      open={isOpen}
    >
      <DialogContent width="lg">
        <DialogHeader>
          <DialogTitle>Pick Project</DialogTitle>
        </DialogHeader>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>Name</Table.Head>
              <Table.Head>Directory</Table.Head>
              <Table.Head />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {projects.map((project) => (
              <Table.Row key={project.id}>
                <Table.Cell>
                  <strong>{project.name}</strong>
                </Table.Cell>
                <Table.Cell>{project.directory}</Table.Cell>
                <Table.Cell>
                  {currentProjectId === project.id ? (
                    <Button variant="link" disabled>
                      Selected
                    </Button>
                  ) : (
                    <Button
                      variant="link"
                      onClick={() => {
                        setCurrentProjectId(project.id);
                        navigate('/');
                        if (onClose) {
                          onClose();
                        }
                      }}
                    >
                      Select
                    </Button>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
