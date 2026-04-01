import type React from 'react';

import { appEntityType } from '@baseplate-dev/project-builder-lib';
import { createFileRoute, notFound, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/packages/apps/$key')({
  component: AppLayout,
  beforeLoad: ({ params: { key }, context: { projectDefinition } }) => {
    const id = appEntityType.idFromKey(key);
    const app = id && projectDefinition.apps.find((a) => a.id === id);
    if (!app) {
      return {};
    }
    return {
      getTitle: () => app.name,
      app,
    };
  },
  // Workaround for https://github.com/TanStack/router/issues/2139#issuecomment-2632375738
  // where throwing notFound() in beforeLoad causes the not found component to be rendered incorrectly
  loader: ({ context: { app } }) => {
    if (!app) throw notFound();
    return { app };
  },
});

function AppLayout(): React.JSX.Element {
  return <Outlet />;
}
