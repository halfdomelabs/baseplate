import type React from 'react';

import { libraryEntityType } from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import { Badge } from '@baseplate-dev/ui-components';
import { createFileRoute, notFound, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/apps/packages/$key')({
  component: EditPackagePage,
  beforeLoad: ({ params: { key }, context: { projectDefinition } }) => {
    const id = libraryEntityType.idFromKey(key);
    const pkg = id && projectDefinition.libraries.find((lib) => lib.id === id);
    if (!pkg) {
      return {};
    }
    return {
      getTitle: () => pkg.name,
      pkg,
    };
  },
  // Workaround for https://github.com/TanStack/router/issues/2139#issuecomment-2632375738
  // where throwing notFound() in beforeLoad causes the not found component to be rendered incorrectly
  loader: ({ context: { pkg } }) => {
    if (!pkg) throw notFound();
    return { pkg };
  },
});

function EditPackagePage(): React.JSX.Element {
  const { definition } = useProjectDefinition();

  const { pkg } = Route.useLoaderData();

  const { packageScope } = definition.settings.general;

  return (
    <div
      className="relative flex h-full flex-1 flex-col overflow-hidden"
      key={pkg.id}
    >
      <div className="max-w-7xl space-y-4 p-4">
        <div className="flex items-center gap-3">
          <h2>{packageScope ? `@${packageScope}/${pkg.name}` : pkg.name}</h2>
          <Badge variant="secondary">{pkg.type}</Badge>
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
