import type React from 'react';

import { ErrorableLoader } from '@halfdomelabs/ui-components';
import { useEffect, useState } from 'react';
import { useProjects } from 'src/hooks/useProjects';
import { logError } from 'src/services/error-logger';
import { getProjects } from 'src/services/remote';

import { setLocalStorageProjectId } from '@src/services/project-id.service';

import { ProjectChooserDialog } from './ProjectChooserDialog';

interface ProjectChooserGateProps {
  children: React.ReactNode;
}

export function ProjectChooserGate({
  children,
}: ProjectChooserGateProps): React.JSX.Element {
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
    return <ProjectChooserDialog isOpen />;
  }

  return <>{children}</>;
}
