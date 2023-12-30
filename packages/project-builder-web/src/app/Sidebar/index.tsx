import { appEntityType } from '@halfdomelabs/project-builder-lib';
import { useState } from 'react';
import { FaDatabase, FaList } from 'react-icons/fa';
import {
  MdApps,
  MdAttachFile,
  MdImportExport,
  MdPeople,
  MdSettings,
} from 'react-icons/md';

import { ProjectChooserDialog } from 'src/app/components/ProjectChooserDialog';
import ProjectSyncModal from 'src/app/components/ProjectSyncModal';
import { LinkButton, Sidebar } from 'src/components';
import { useProjectConfig } from 'src/hooks/useProjectConfig';

function AppSidebar(): JSX.Element {
  const { config } = useProjectConfig();
  const [showProjectChooserModal, setShowProjectChooserModal] = useState(false);

  return (
    <>
      <ProjectChooserDialog
        onClose={() => setShowProjectChooserModal(false)}
        isOpen={showProjectChooserModal}
      />
      <Sidebar className="flex-none">
        <Sidebar.Header className="mb-4 space-y-2">
          <h1>App Builder</h1>
          <div>
            <strong>
              {config.name} (
              <LinkButton onClick={() => setShowProjectChooserModal(true)}>
                Change
              </LinkButton>
              )
            </strong>
          </div>
          <ProjectSyncModal />
        </Sidebar.Header>
        <Sidebar.LinkGroup>
          <Sidebar.LinkItem Icon={MdImportExport} to="/">
            Import/Export
          </Sidebar.LinkItem>
          <Sidebar.LinkItem Icon={MdSettings} to="/general">
            General
          </Sidebar.LinkItem>
          <Sidebar.Dropdown Icon={MdApps} label="Apps">
            <Sidebar.DropdownLinkItem withParentIcon to="/apps/new">
              New App
            </Sidebar.DropdownLinkItem>
            {config.apps.map((app) => (
              <Sidebar.DropdownLinkItem
                key={app.id}
                withParentIcon
                to={`/apps/edit/${appEntityType.toUid(app.id)}`}
              >
                {app.name}
              </Sidebar.DropdownLinkItem>
            ))}
          </Sidebar.Dropdown>
          <Sidebar.LinkItem Icon={FaDatabase} to="/models">
            Models
          </Sidebar.LinkItem>
          <Sidebar.LinkItem Icon={FaList} to="/enums">
            Enums
          </Sidebar.LinkItem>
          <Sidebar.LinkItem Icon={MdPeople} to="/auth">
            Auth
          </Sidebar.LinkItem>
          <Sidebar.LinkItem Icon={MdAttachFile} to="/storage">
            Storage
          </Sidebar.LinkItem>
        </Sidebar.LinkGroup>
      </Sidebar>
    </>
  );
}

export default AppSidebar;
