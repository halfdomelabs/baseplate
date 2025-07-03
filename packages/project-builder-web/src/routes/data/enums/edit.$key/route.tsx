import type React from 'react';

import {
  EnumUtils,
  modelEnumEntityType,
} from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import { createFileRoute, Outlet } from '@tanstack/react-router';

import { NotFoundCard } from '#src/components/index.js';

import { EnumHeaderBar } from './-components/enum-header-bar.js';

export const Route = createFileRoute('/data/enums/edit/$key')({
  component: EnumEditLayout,
  beforeLoad: () => ({
    getTitle: () => 'Edit Enum',
  }),
});

export function EnumEditLayout(): React.JSX.Element {
  const { key } = Route.useParams();
  const { definition } = useProjectDefinition();

  const id = modelEnumEntityType.idFromKey(key);

  const enumDefinition = EnumUtils.byId(definition, id);

  if (!enumDefinition) {
    return <NotFoundCard />;
  }

  return (
    <div
      className="relative flex h-full flex-1 flex-col overflow-hidden"
      key={id}
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
