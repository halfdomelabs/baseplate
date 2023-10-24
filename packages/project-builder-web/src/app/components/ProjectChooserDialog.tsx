import {
  ErrorableLoader,
  Dialog,
  Table,
  LinkButton,
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
          <Table.Head>
            <Table.HeadRow>
              <Table.HeadCell>Name</Table.HeadCell>
              <Table.HeadCell>Directory</Table.HeadCell>
              <Table.HeadCell />
            </Table.HeadRow>
          </Table.Head>
          <Table.Body>
            {projects.map((project) => (
              <Table.Row key={project.id}>
                <Table.Cell>
                  <strong>{project.name}</strong>
                </Table.Cell>
                <Table.Cell>{project.directory}</Table.Cell>
                <Table.Cell>
                  {projectId === project.id ? (
                    <LinkButton disabled>Selected</LinkButton>
                  ) : (
                    <LinkButton
                      onClick={() => {
                        setProjectId(project.id);
                        navigate('/');
                        if (onClose) {
                          onClose();
                        }
                      }}
                    >
                      Select
                    </LinkButton>
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
