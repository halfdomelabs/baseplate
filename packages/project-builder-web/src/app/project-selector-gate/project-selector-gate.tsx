import type React from 'react';

import { ErrorableLoader } from '@baseplate-dev/ui-components';
import { useEffect, useState } from 'react';

import { useProjects } from '#src/hooks/use-projects.js';
import { getProjects } from '#src/services/api/index.js';
import { logAndFormatError } from '#src/services/error-formatter.js';
import { setLocalStorageProjectId } from '#src/services/project-id.service.js';

import { ProjectSelectDialog } from './project-selector-dialog.js';

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
