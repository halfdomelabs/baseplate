import type React from 'react';

import {
  Button,
  Dialog,
  ErrorableLoader,
  Table,
} from '@halfdomelabs/ui-components';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from 'src/hooks/useProjects';
import { logError } from 'src/services/error-logger';

import { getProjects } from '@src/services/api';

interface ProjectSelectDialogProps {
  onClose?: () => void;
  isOpen?: boolean;
}

export function ProjectSelectDialog({
  onClose,
  isOpen,
}: ProjectSelectDialogProps): React.JSX.Element {
  const { currentProjectId, setCurrentProjectId, setProjects, projects } =
    useProjects();
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getProjects()
      .then((data) => {
        setProjects(data);
      })
      .catch((err: unknown) => {
        logError(err);
        setError(err as Error);
      });
  }, [setProjects, isOpen]);

  if (projects.length === 0) {
    return <ErrorableLoader error={error} />;
  }

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
      </Dialog.Content>
    </Dialog>
  );
}
