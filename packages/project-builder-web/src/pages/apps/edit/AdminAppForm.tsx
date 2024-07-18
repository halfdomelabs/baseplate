import { AdminAppConfig } from '@halfdomelabs/project-builder-lib';
import clsx from 'clsx';
import { Route, Routes } from 'react-router-dom';

import AdminGeneralForm from './admin/AdminGeneralForm';
import AdminSectionsForm from './admin/AdminSectionsForm';
import { NavigationTabs } from 'src/components';

interface Props {
  className?: string;
  appConfig: AdminAppConfig;
}

function AdminAppForm({ className, appConfig }: Props): JSX.Element {
  return (
    <div className={clsx('', className)}>
      <NavigationTabs>
        <NavigationTabs.Tab to="">General</NavigationTabs.Tab>
        <NavigationTabs.Tab to="sections">Sections</NavigationTabs.Tab>
      </NavigationTabs>
      <div className="bg-slate-200">
        <Routes>
          <Route
            index
            element={
              <div className="p-4">
                <AdminGeneralForm appConfig={appConfig} />
              </div>
            }
          />
          <Route
            path="/sections/*"
            element={<AdminSectionsForm appConfig={appConfig} />}
          />
        </Routes>
      </div>
    </div>
  );
}

export default AdminAppForm;
