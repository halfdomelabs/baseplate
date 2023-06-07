import { Button, NavigationLink } from '@halfdomelabs/ui-components';
import { useState } from 'react';
import { HiDatabase, HiSwitchHorizontal, HiCollection } from 'react-icons/hi';
import { MdApps } from 'react-icons/md';
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
      <div className="flex items-center space-x-4">
        <img src="/images/logo.png" alt="logo" className="h-6 w-6" />
        <h3>{config.name}</h3>
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
      {projects.length > 1 && (
        <Button
          variant="tertiary"
          onClick={() => setShowProjectChooserModal(true)}
          iconBefore={HiSwitchHorizontal}
          title="Switch Project"
        />
      )}
    </div>
  );
}
