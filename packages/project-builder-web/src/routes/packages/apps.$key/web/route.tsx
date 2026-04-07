import type React from 'react';

import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { AppContentLayout } from '../-components/app-content-layout.js';
import { AppHeaderBar } from '../-components/app-header-bar.js';

export const Route = createFileRoute('/packages/apps/$key/web')({
  component: WebAppLayout,
  beforeLoad: ({ context: { app }, params: { key } }) => {
    if (app?.type !== 'web') {
      throw redirect({ to: '/packages/apps/$key', params: { key } });
    }

    return {
      app,
      webDefinition: app,
    };
  },
  loader: ({ context: { app } }) => ({ app }),
});

function WebAppLayout(): React.JSX.Element {
  const { app } = Route.useLoaderData();

  return (
    <AppContentLayout header={<AppHeaderBar app={app} />}>
      <Outlet />
    </AppContentLayout>
  );
}
