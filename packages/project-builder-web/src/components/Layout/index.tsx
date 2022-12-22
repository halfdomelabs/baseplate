import classNames from 'classnames';
import { useState } from 'react';
import { FaDatabase, FaList } from 'react-icons/fa';
import {
  MdPeople,
  MdSettings,
  MdImportExport,
  MdApps,
  MdAttachFile,
} from 'react-icons/md';
import { Outlet } from 'react-router-dom';
import ProjectChooserModal from 'src/app/ProjectChooserModal';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { LinkButton } from '..';
import Sidebar from '../Sidebar';

interface Props {
  className?: string;
  centered?: boolean;
  noPadding?: boolean;
}

function Layout({ className, centered, noPadding }: Props): JSX.Element {
  const { config } = useProjectConfig();
  const [showProjectChooserModal, setShowProjectChooserModal] = useState(false);

  return (
    <div className={classNames('h-full items-stretch flex', className)}>
      <ProjectChooserModal
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
                key={app.uid}
                withParentIcon
                to={`/apps/edit/${app.uid}`}
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
      <div
        className={classNames(
          'flex flex-col flex-auto overflow-auto',
          centered && 'items-center justify-center',
          !noPadding && 'p-4'
        )}
      >
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
