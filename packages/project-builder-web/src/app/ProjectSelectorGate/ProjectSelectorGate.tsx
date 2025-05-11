import type React from 'react';

import { ErrorableLoader } from '@halfdomelabs/ui-components';
import { useEffect, useState } from 'react';

import { useProjects } from '@src/hooks/useProjects';
import { getProjects } from '@src/services/api';
import { logAndFormatError } from '@src/services/error-formatter';
import { setLocalStorageProjectId } from '@src/services/project-id.service';

import { ProjectSelectDialog } from './ProjectSelectorDialog';

interface ProjectSelectorGateProps {
  children: React.ReactNode;
}

/**
 * Gate that ensures a project is selected before rendering the app
 */
export function ProjectSelectorGate({
  children,
}: ProjectSelectorGateProps): React.JSX.Element {
  const [error, setError] = useState<string>();
  const { currentProjectId, projectsLoaded, setProjects } = useProjects();

  useEffect(() => {
    getProjects()
      .then((data) => {
        setProjects(data);
      })
      .catch((err: unknown) => {
        setError(logAndFormatError(err, 'Failed to fetch projects.'));
      });
  }, [setProjects]);

  useEffect(() => {
    setLocalStorageProjectId(currentProjectId);
  }, [currentProjectId]);

  if (!projectsLoaded) {
    return <ErrorableLoader error={error} />;
  }

  if (!currentProjectId) {
    return <ProjectSelectDialog isOpen />;
  }

  return <>{children}</>;
}
