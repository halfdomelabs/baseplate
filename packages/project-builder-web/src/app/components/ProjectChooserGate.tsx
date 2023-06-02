import { useEffect } from 'react';
import { useMount } from 'src/hooks/useMount';
import { useProjectIdState } from 'src/hooks/useProjectIdState';
import { useProjects } from 'src/hooks/useProjects';
import { logError } from 'src/services/error-logger';
import { getProjects } from 'src/services/remote';
import { ProjectChooserDialog } from './ProjectChooserDialog';

interface ProjectChooserGateProps {
  children: React.ReactNode;
}

export function ProjectChooserGate({
  children,
}: ProjectChooserGateProps): JSX.Element {
  const [projectId, setProjectId] = useProjectIdState();

  const { setProjects } = useProjects();

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
      });
  });

  if (!projectId) {
    return <ProjectChooserDialog isOpen />;
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
}
