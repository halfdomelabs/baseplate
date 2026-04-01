import type React from 'react';

import { appEntityType } from '@baseplate-dev/project-builder-lib';
import {
  createFileRoute,
  notFound,
  Outlet,
  redirect,
} from '@tanstack/react-router';

export const Route = createFileRoute('/packages/apps/$key/admin-sections')({
  component: AdminSectionsLayout,
  beforeLoad: ({ params: { key }, context: { projectDefinition } }) => {
    const appId = appEntityType.idFromKey(key);
    const app = appId
      ? projectDefinition.apps.find((a) => a.id === appId)
      : undefined;
    if (app?.type !== 'web') {
      return {};
    }
    const { adminApp } = app;
    return {
      getTitle: () => app.name,
      app,
      adminApp,
    };
  },
  loader: ({ context: { app, adminApp }, params: { key } }) => {
    if (!app) throw notFound();
    if (!adminApp.enabled)
      throw redirect({
        to: '/packages/apps/$key',
        params: { key },
      });
    return { app, adminApp };
  },
});

function AdminSectionsLayout(): React.JSX.Element {
  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden">
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
