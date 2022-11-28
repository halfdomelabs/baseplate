import { useProjectIdState } from 'src/hooks/useProjectIdState';
import ProjectChooserModal from '../ProjectChooserModal';

interface Props {
  children: React.ReactNode;
}

function ProjectChooserGate({ children }: Props): JSX.Element {
  const [projectId] = useProjectIdState(null);

  if (!projectId) {
    return <ProjectChooserModal onClose={() => {}} />;
  }

  return <div>{children}</div>;
}

export default ProjectChooserGate;
