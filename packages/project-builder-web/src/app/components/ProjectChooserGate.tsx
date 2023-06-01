import { useProjectIdState } from 'src/hooks/useProjectIdState';
import { ProjectChooserDialog } from './ProjectChooserDialog';

interface ProjectChooserGateProps {
  children: React.ReactNode;
}

export function ProjectChooserGate({
  children,
}: ProjectChooserGateProps): JSX.Element {
  const [projectId] = useProjectIdState();

  if (!projectId) {
    return <ProjectChooserDialog isOpen />;
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
}
