import type React from 'react';

import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

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
    <div className="relative flex h-full flex-1 flex-col overflow-hidden">
      <AppHeaderBar app={app} />
      <div
        className="mb-(--action-bar-height) flex flex-1 overflow-y-auto"
        style={
          {
            '--action-bar-height': '52px',
          } as React.CSSProperties
        }
      >
        <Outlet />
      </div>
    </div>
  );
}
