import type React from 'react';

import {
  EnumUtils,
  modelEnumEntityType,
} from '@baseplate-dev/project-builder-lib';
import { createFileRoute, notFound, Outlet } from '@tanstack/react-router';

import { EnumHeaderBar } from './-components/enum-header-bar.js';

export const Route = createFileRoute('/data/enums/edit/$key')({
  component: EnumEditLayout,
  beforeLoad: ({ params: { key }, context: { projectDefinition } }) => {
    const id = modelEnumEntityType.idFromKey(key);
    const enumDefinition = EnumUtils.byId(projectDefinition, id);
    if (!enumDefinition) throw notFound();
    return {
      getTitle: () => enumDefinition.name,
      enumDefinition,
    };
  },
});

function EnumEditLayout(): React.JSX.Element {
  const { enumDefinition } = Route.useRouteContext();

  return (
    <div
      className="relative flex h-full flex-1 flex-col overflow-hidden"
      key={enumDefinition.id}
    >
      <div className="mx-4 max-w-7xl space-y-4 border-b py-4">
        <EnumHeaderBar enumDefinition={enumDefinition} />
      </div>
      <div className="mb-(--action-bar-height) flex flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
