import { useProjectIdState } from 'src/hooks/useProjectIdState';
import ProjectChooserModal from '../ProjectChooserModal';

interface Props {
  children: React.ReactNode;
}

function ProjectChooserGate({ children }: Props): JSX.Element {
  const [projectId] = useProjectIdState(null);

  if (!projectId) {
    return <ProjectChooserModal onClose={() => {}} isOpen />;
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
}

export default ProjectChooserGate;
