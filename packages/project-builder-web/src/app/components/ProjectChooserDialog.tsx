import {
  Button,
  Dialog,
  ErrorableLoader,
  Table,
} from '@halfdomelabs/ui-components';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useProjectIdState } from 'src/hooks/useProjectIdState';
import { useProjects } from 'src/hooks/useProjects';
import { logError } from 'src/services/error-logger';
import { getProjects } from 'src/services/remote';

interface ProjectChooserDialogProps {
  onClose?: () => void;
  isOpen?: boolean;
}

export function ProjectChooserDialog({
  onClose,
  isOpen,
}: ProjectChooserDialogProps): JSX.Element {
  const [projectId, setProjectId] = useProjectIdState();
  const [error, setError] = useState<Error | null>(null);
  const { projects, setProjects } = useProjects();
  const navigate = useNavigate();

  useEffect(() => {
    getProjects()
      .then((data) => {
        setProjects(data);
      })
      .catch((err) => {
        logError(err);
        setError(err as Error);
      });
  }, [setProjects, setProjectId]);

  if (!projects) {
    return <ErrorableLoader error={error} />;
  }

  return (
    <Dialog
      onOpenChange={
        onClose ??
        (() => {
          /* dummy */
        })
      }
      open={isOpen}
    >
      <Dialog.Content width="lg">
        <Dialog.Header>
          <Dialog.Title>Pick Project</Dialog.Title>
        </Dialog.Header>
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
                  {projectId === project.id ? (
                    <Button variant="link" disabled>
                      Selected
                    </Button>
                  ) : (
                    <Button
                      variant="link"
                      onClick={() => {
                        setProjectId(project.id);
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
      </Dialog.Content>
    </Dialog>
  );
}
