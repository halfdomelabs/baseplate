import { useProjects } from '@src/hooks/useProjects';

export function PluginsHomePage(): JSX.Element {
  const { currentProjectId } = useProjects();
  return (
    <div>
      <h1>Plugins</h1>
      <p>Current project id: {currentProjectId}</p>
    </div>
  );
}
