import type React from 'react';

import { libraryTypeSpec } from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import { createFileRoute, notFound } from '@tanstack/react-router';

export const Route = createFileRoute('/packages/libs/$key/')({
  component: PackageEditPage,
  loader: ({ context: { pkg } }) => {
    if (!pkg) throw notFound();
    return { packageDefinition: pkg };
  },
});

function PackageEditPage(): React.JSX.Element {
  const { pluginContainer } = useProjectDefinition();
  const { packageDefinition } = Route.useLoaderData();

  const librarySpec = pluginContainer.use(libraryTypeSpec);
  const webConfig = librarySpec.webConfigs.get(packageDefinition.type);

  if (!webConfig) {
    return (
      <div className="p-4">
        Web config for package type &quot;{packageDefinition.type}&quot; not
        found
      </div>
    );
  }

  const { EditComponent } = webConfig;
  return <EditComponent packageDefinition={packageDefinition} />;
}
