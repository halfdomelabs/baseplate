import type React from 'react';

import { appEntityType } from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import { Badge } from '@baseplate-dev/ui-components';
import { createFileRoute, notFound, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/packages/apps/$key')({
  component: EditAppPage,
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

function EditAppPage(): React.JSX.Element {
  const { definition } = useProjectDefinition();

  const { app } = Route.useLoaderData();

  const { packageScope } = definition.settings.general;

  return (
    <div
      className="relative flex h-full flex-1 flex-col overflow-hidden"
      key={app.id}
    >
      <div className="max-w-7xl space-y-4 p-4">
        <div className="flex items-center gap-3">
          <h2>{packageScope ? `@${packageScope}/${app.name}` : app.name}</h2>
          <Badge variant="secondary">{app.type}</Badge>
        </div>
      </div>
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
