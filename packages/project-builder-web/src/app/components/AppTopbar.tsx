import { Button, NavigationMenu } from '@halfdomelabs/ui-components';
import { useState } from 'react';
import { HiCollection, HiDatabase, HiSwitchHorizontal } from 'react-icons/hi';
import { MdApps, MdSettings } from 'react-icons/md';
import { Link, NavLink } from 'react-router-dom';

import { ProjectChooserDialog } from 'src/app/components/ProjectChooserDialog';
import ProjectSyncModal from 'src/app/components/ProjectSyncModal';
import { useProjectDefinition } from 'src/hooks/useProjectDefinition';
import { useProjects } from 'src/hooks/useProjects';

export function AppTopbar(): JSX.Element {
  const { config } = useProjectDefinition();
  const [showProjectChooserModal, setShowProjectChooserModal] = useState(false);

  const { projects } = useProjects();

  return (
    <div className="flex items-center justify-between border-b border-foreground-200 bg-white p-4 dark:bg-background-800">
      <ProjectChooserDialog
        onClose={() => setShowProjectChooserModal(false)}
        isOpen={showProjectChooserModal}
      />
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-2">
          <img src="/images/logo.png" alt="logo" className="h-12 w-12" />
          <Link to="/">
            <h3>{config.name}</h3>
          </Link>
        </div>
        <ProjectSyncModal />
        <NavigationMenu>
          <NavigationMenu.List>
            <NavigationMenu.ItemWithLink asChild>
              <NavLink to="/apps">
                <MdApps />
                Apps
              </NavLink>
            </NavigationMenu.ItemWithLink>
            <NavigationMenu.ItemWithLink asChild>
              <NavLink to="/models">
                <HiDatabase />
                Models
              </NavLink>
            </NavigationMenu.ItemWithLink>
            <NavigationMenu.ItemWithLink asChild>
              <NavLink to="/features">
                <HiCollection />
                Features
              </NavLink>
            </NavigationMenu.ItemWithLink>
          </NavigationMenu.List>
        </NavigationMenu>
      </div>
      <div className="flex items-center space-x-4">
        <NavLink to="/settings">
          <Button.WithIcon
            variant="ghost"
            size="icon"
            icon={MdSettings}
            title="Project Settings"
          />
        </NavLink>
        {projects.length > 1 && (
          <Button.WithIcon
            variant="ghost"
            size="icon"
            onClick={() => setShowProjectChooserModal(true)}
            icon={HiSwitchHorizontal}
            title="Switch project"
          />
        )}
      </div>
    </div>
  );
}
