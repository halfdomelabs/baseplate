import type React from 'react';

import {
  EnumUtils,
  modelEnumEntityType,
} from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { Outlet, useParams } from 'react-router-dom';

import { NotFoundCard } from '@src/components';

import { EnumHeaderBar } from './components/EnumHeaderBar';

export function EnumEditLayout(): React.JSX.Element {
  const { uid } = useParams<'uid'>();
  const { definition } = useProjectDefinition();

  const id = modelEnumEntityType.fromUid(uid);

  const enumDefinition = EnumUtils.byId(definition, id ?? '');

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
