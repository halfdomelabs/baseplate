import type React from 'react';

import {
  NavigationTabs,
  NavigationTabsItem,
} from '@baseplate-dev/ui-components';
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
} from '@tanstack/react-router';

export const Route = createFileRoute('/packages/apps/$key/web')({
  component: WebAppLayout,
  beforeLoad: ({ context: { app }, params: { key } }) => {
    if (app?.type !== 'web') {
      throw redirect({ to: '/packages/apps/$key', params: { key } });
    }

    return {
      webDefinition: app,
    };
  },
});

function WebAppLayout(): React.JSX.Element {
  const { key } = Route.useParams();
  return (
    <div className="p-4">
      <NavigationTabs>
        <NavigationTabsItem asChild>
          <Link
            to="/packages/apps/$key/web"
            params={{ key }}
            activeOptions={{ exact: true }}
          >
            General
          </Link>
        </NavigationTabsItem>
        <NavigationTabsItem asChild>
          <Link to="/packages/apps/$key/web/admin" params={{ key }}>
            Admin
          </Link>
        </NavigationTabsItem>
      </NavigationTabs>

      <div className="mt-4 border-t">
        <Outlet />
      </div>
    </div>
  );
}
