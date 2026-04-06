import type React from 'react';

import { appEntityType } from '@baseplate-dev/project-builder-lib';
import {
  createFileRoute,
  notFound,
  Outlet,
  redirect,
} from '@tanstack/react-router';

import { AppContentLayout } from '../-components/app-content-layout.js';

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
    <AppContentLayout>
      <Outlet />
    </AppContentLayout>
  );
}
