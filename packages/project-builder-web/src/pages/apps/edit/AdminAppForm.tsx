import { AdminAppConfig } from '@halfdomelabs/project-builder-lib';
import { NavigationTabs } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { NavLink, Route, Routes } from 'react-router-dom';

import AdminGeneralForm from './admin/AdminGeneralForm';
import AdminSectionsForm from './admin/AdminSectionsForm';

interface Props {
  className?: string;
  appConfig: AdminAppConfig;
}

function AdminAppForm({ className, appConfig }: Props): JSX.Element {
  return (
    <div className={clsx('', className)}>
      <NavigationTabs>
        <NavigationTabs.Item asChild>
          <NavLink to="" end>
            General
          </NavLink>
        </NavigationTabs.Item>
        <NavigationTabs.Item asChild>
          <NavLink to="sections">Sections</NavLink>
        </NavigationTabs.Item>
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
