import { AdminAppConfig } from '@baseplate/project-builder-lib';
import classNames from 'classnames';
import { Route, Routes } from 'react-router-dom';
import { NavigationTabs } from 'src/components';
import AdminGeneralForm from './admin/AdminGeneralForm';

interface Props {
  className?: string;
  appConfig: AdminAppConfig;
}

function AdminAppForm({ className, appConfig }: Props): JSX.Element {
  return (
    <div className={classNames('', className)}>
      <NavigationTabs>
        <NavigationTabs.Tab to="">General</NavigationTabs.Tab>
        <NavigationTabs.Tab to="sections">Sections</NavigationTabs.Tab>
      </NavigationTabs>
      <div className="p-4 bg-slate-200">
        <Routes>
          <Route index element={<AdminGeneralForm appConfig={appConfig} />} />
        </Routes>
      </div>
    </div>
  );
}

export default AdminAppForm;
