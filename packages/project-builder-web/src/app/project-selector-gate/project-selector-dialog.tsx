import type React from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@baseplate-dev/ui-components';

import { useProjects } from '#src/hooks/use-projects.js';

interface ProjectSelectDialogProps {
  onClose?: () => void;
  isOpen?: boolean;
}

export function ProjectSelectDialog({
  onClose,
  isOpen,
}: ProjectSelectDialogProps): React.JSX.Element {
  const { currentProjectId, setCurrentProjectId, projects } = useProjects();

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
          <DialogDescription>Select a project to continue.</DialogDescription>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Directory</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <strong>{project.name}</strong>
                </TableCell>
                <TableCell>{project.directory}</TableCell>
                <TableCell>
                  {currentProjectId === project.id ? (
                    <Button variant="link" disabled>
                      Selected
                    </Button>
                  ) : (
                    <Button
                      variant="link"
                      onClick={() => {
                        setCurrentProjectId(project.id);
                        history.pushState(null, '', '/');
                        if (onClose) {
                          onClose();
                        }
                      }}
                    >
                      Select
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
