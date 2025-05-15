import type { AdminAppConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';

import {
  NavigationTabs,
  NavigationTabsItem,
} from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { NavLink, Route, Routes } from 'react-router-dom';

import AdminGeneralForm from './admin/AdminGeneralForm';
import AdminSectionsForm from './admin/AdminSectionsForm';

interface Props {
  className?: string;
  appConfig: AdminAppConfig;
}

function AdminAppForm({ className, appConfig }: Props): React.JSX.Element {
  return (
    <div className={clsx('', className)}>
      <NavigationTabs>
        <NavigationTabsItem asChild>
          <NavLink to="" end>
            General
          </NavLink>
        </NavigationTabsItem>
        <NavigationTabsItem asChild>
          <NavLink to="sections">Sections</NavLink>
        </NavigationTabsItem>
      </NavigationTabs>
      <div className="mt-4 border-t">
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
