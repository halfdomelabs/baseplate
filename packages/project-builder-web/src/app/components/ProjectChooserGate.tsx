import { ErrorableLoader } from '@halfdomelabs/ui-components';
import { useState } from 'react';

import { ProjectChooserDialog } from './ProjectChooserDialog';
import { useMount } from 'src/hooks/useMount';
import { useProjectIdState } from 'src/hooks/useProjectIdState';
import { useProjects } from 'src/hooks/useProjects';
import { logError } from 'src/services/error-logger';
import { getProjects } from 'src/services/remote';

interface ProjectChooserGateProps {
  children: React.ReactNode;
}

export function ProjectChooserGate({
  children,
}: ProjectChooserGateProps): JSX.Element {
  const [projectId, setProjectId] = useProjectIdState();
  const [error, setError] = useState(null);
  const { projectsLoaded, setProjects } = useProjects();

  useMount(() => {
    getProjects()
      .then((data) => {
        if (data.length === 1 && projectId === null) {
          setProjectId(data[0].id);
        }
        setProjects(data);
      })
      .catch((err) => {
        logError(err);
        setError(error);
      });
  });

  if (!projectId && !projectsLoaded) {
    return <ErrorableLoader error={error} />;
  }

  if (!projectId) {
    return <ProjectChooserDialog isOpen />;
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
}
