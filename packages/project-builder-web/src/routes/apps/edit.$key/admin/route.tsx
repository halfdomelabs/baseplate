import type React from 'react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  NavigationTabs,
  NavigationTabsItem,
} from '@baseplate-dev/ui-components';
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
} from '@tanstack/react-router';

export const Route = createFileRoute('/apps/edit/$key/admin')({
  component: AdminAppEditLayout,
  beforeLoad: ({ context: { app }, params: { key } }) => {
    if (app?.type !== 'admin') {
      throw redirect({ to: '/apps/edit/$key', params: { key } });
    }
    return {
      adminDefinition: app,
    };
  },
});

function AdminAppEditLayout(): React.JSX.Element {
  const { key } = Route.useParams();
  return (
    <div className="p-4">
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
          <Link
            to="/apps/edit/$key/admin"
            from="/"
            params={{ key }}
            activeOptions={{ exact: true }}
          >
            General
          </Link>
        </NavigationTabsItem>
        <NavigationTabsItem asChild>
          <Link to="/apps/edit/$key/admin/sections" params={{ key }}>
            Sections
          </Link>
        </NavigationTabsItem>
      </NavigationTabs>
      <div className="mt-4 border-t">
        <Outlet />
      </div>
    </div>
  );
}
