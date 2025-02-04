import type React from 'react';

import { ErrorableLoader } from '@halfdomelabs/ui-components';
import { useEffect, useState } from 'react';
import { useProjects } from 'src/hooks/useProjects';
import { logError } from 'src/services/error-logger';
import { getProjects } from 'src/services/remote';

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
  const [error, setError] = useState<unknown>(null);
  const { currentProjectId, projectsLoaded, setProjects } = useProjects();

  useEffect(() => {
    getProjects()
      .then((data) => {
        setProjects(data);
      })
      .catch((err: unknown) => {
        logError(err);
        setError(err);
      });
  }, [setProjects]);

  useEffect(() => {
    setLocalStorageProjectId(currentProjectId);
  }, [currentProjectId]);

  if (!currentProjectId && !projectsLoaded) {
    return <ErrorableLoader error={error} />;
  }

  if (!currentProjectId) {
    return <ProjectSelectDialog isOpen />;
  }

  return <>{children}</>;
}
