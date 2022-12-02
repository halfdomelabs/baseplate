import { useEffect, useState } from 'react';
import { ErrorableLoader, LinkButton, Table } from 'src/components';
import Modal from 'src/components/Modal';
import { useProjectIdState } from 'src/hooks/useProjectIdState';
import { getProjects, Project } from 'src/services/remote';

interface Props {
  onClose: () => void;
  isOpen?: boolean;
}

function ProjectChooserModal({ onClose, isOpen }: Props): JSX.Element {
  const [, setProjectId] = useProjectIdState(null);
  const [projects, setProjects] = useState<Project[]>();
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getProjects()
      .then((data) => {
        setProjects(data);
      })
      .catch((err) => {
        console.error(err);
        setError(err as Error);
      });
  }, []);

  if (!projects) {
    return <ErrorableLoader error={error} />;
  }

  return (
    <Modal width="base" onClose={onClose} isOpen={isOpen}>
      <Modal.Header>Pick Project</Modal.Header>
      <Modal.Body>
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
                  <LinkButton
                    onClick={() => {
                      setProjectId(project.id);
                      onClose();
                    }}
                  >
                    Select
                  </LinkButton>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Modal.Body>
    </Modal>
  );
}

export default ProjectChooserModal;
