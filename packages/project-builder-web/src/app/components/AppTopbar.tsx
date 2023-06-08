import { NavigationLink } from '@halfdomelabs/ui-components';
import { useState } from 'react';
import { HiCollection, HiDatabase, HiSwitchHorizontal } from 'react-icons/hi';
import { MdApps, MdSettings } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { ProjectChooserDialog } from 'src/app/components/ProjectChooserDialog';
import ProjectSyncModal from 'src/app/components/ProjectSyncModal';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useProjects } from 'src/hooks/useProjects';

export function AppTopbar(): JSX.Element {
  const { config } = useProjectConfig();
  const [showProjectChooserModal, setShowProjectChooserModal] = useState(false);

  const { projects } = useProjects();

  return (
    <div className="flex items-center justify-between border-b border-foreground-200 bg-white p-4">
      <ProjectChooserDialog
        onClose={() => setShowProjectChooserModal(false)}
        isOpen={showProjectChooserModal}
      />
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-2">
          <img src="/images/logo.png" alt="logo" className="h-6 w-6" />
          <h3>{config.name}</h3>
        </div>
        <div className="flex items-center space-x-4">
          <ProjectSyncModal />
          <NavigationLink as={Link} to="/apps" icon={MdApps}>
            Apps
          </NavigationLink>
          <NavigationLink as={Link} to="/models" icon={HiDatabase}>
            Models
          </NavigationLink>
          <NavigationLink as={Link} to="/settings" icon={HiCollection}>
            Features
          </NavigationLink>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <NavigationLink as={Link} to="/settings" icon={MdSettings} />
        {projects.length > 1 && (
          <NavigationLink
            as="button"
            onClick={() => setShowProjectChooserModal(true)}
            icon={HiSwitchHorizontal}
            title="Switch project"
          />
        )}
      </div>
    </div>
  );
}
