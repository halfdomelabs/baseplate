import type { AdminAppConfig } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  NavigationTabs,
  NavigationTabsItem,
} from '@baseplate-dev/ui-components';
import clsx from 'clsx';
import { NavLink, Route, Routes } from 'react-router-dom';

import AdminGeneralForm from './admin/admin-general-form.js';
import AdminSectionsForm from './admin/admin-sections-form.js';

interface Props {
  className?: string;
  appConfig: AdminAppConfig;
}

function AdminAppForm({ className, appConfig }: Props): React.JSX.Element {
  return (
    <div className={clsx('p-4', className)}>
      <Alert variant="warning" className="mb-4">
        <AlertTitle>⚠️ Development Preview</AlertTitle>
        <AlertDescription>
          The admin app functionality will likely be fully rewritten in future
          versions. This is provided for preview purposes only and should not be
          relied upon for production use.
        </AlertDescription>
      </Alert>
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
          <Route index element={<AdminGeneralForm appConfig={appConfig} />} />
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
