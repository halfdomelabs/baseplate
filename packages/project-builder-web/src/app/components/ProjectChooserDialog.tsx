import { ErrorableLoader, Dialog } from '@halfdomelabs/ui-components';
import { useEffect, useState } from 'react';
import { LinkButton, Table } from 'src/components';
import { useProjectIdState } from 'src/hooks/useProjectIdState';
import { logError } from 'src/services/error-logger';
import { getProjects, Project } from 'src/services/remote';

interface ProjectChooserDialogProps {
  onClose: () => void;
  isOpen?: boolean;
}

export function ProjectChooserDialog({
  onClose,
  isOpen,
}: ProjectChooserDialogProps): JSX.Element {
  const [projectId, setProjectId] = useProjectIdState();
  const [projects, setProjects] = useState<Project[]>();
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getProjects()
      .then((data) => {
        setProjects(data);
      })
      .catch((err) => {
        logError(err);
        setError(err as Error);
      });
  }, []);

  if (!projects) {
    return <ErrorableLoader error={error} />;
  }

  return (
    <Dialog size="lg" onClose={onClose} isOpen={isOpen}>
      <Dialog.Header onClose={onClose}>Pick Project</Dialog.Header>
      <Dialog.Body>
        <Table>
          <Table.Head>
            <Table.HeadRow>
              <Table.HeadCell>Name</Table.HeadCell>
              <Table.HeadCell>Directory</Table.HeadCell>
              <Table.HeadCell>Actions</Table.HeadCell>
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
                        onClose();
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
      </Dialog.Body>
    </Dialog>
  );
}
