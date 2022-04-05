import classNames from 'classnames';
import { FaDatabase } from 'react-icons/fa';
import { MdPeople, MdSettings, MdImportExport } from 'react-icons/md';
import { Outlet } from 'react-router-dom';
import { useAppConfig } from 'src/hooks/useAppConfig';
import Sidebar from '../Sidebar';

interface Props {
  className?: string;
  centered?: boolean;
}

function Layout({ className, centered }: Props): JSX.Element {
  const { config } = useAppConfig();
  return (
    <div className={classNames('h-full items-stretch flex', className)}>
      <Sidebar className="flex-none">
        <Sidebar.Header className="mb-4 space-y-2">
          <h1>App Builder</h1>
          <div>
            <strong>{config.name}</strong>
          </div>
        </Sidebar.Header>
        <Sidebar.LinkGroup>
          <Sidebar.Link Icon={MdImportExport} to="/">
            Import/Export
          </Sidebar.Link>
          <Sidebar.Link Icon={MdSettings} to="/general">
            General
          </Sidebar.Link>
          <Sidebar.Link Icon={FaDatabase} to="/models">
            Models
          </Sidebar.Link>
          <Sidebar.Link Icon={MdPeople} to="/auth">
            Auth
          </Sidebar.Link>
        </Sidebar.LinkGroup>
      </Sidebar>
      <div
        className={classNames(
          'p-4 flex flex-col flex-auto',
          centered && 'items-center justify-center'
        )}
      >
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
