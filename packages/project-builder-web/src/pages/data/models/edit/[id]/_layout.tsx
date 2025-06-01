import type React from 'react';

import {
  modelEntityType,
  ModelUtils,
} from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  NavigationTabs,
  NavigationTabsItem,
} from '@baseplate-dev/ui-components';
import { NavLink, Outlet, useParams } from 'react-router-dom';

import { NotFoundCard } from '#src/components/index.js';

import { ModelHeaderBar } from './_components/ModelHeaderBar.js';

export function ModelEditLayout(): React.JSX.Element {
  const { uid } = useParams<'uid'>();
  const { definition } = useProjectDefinition();

  const id = modelEntityType.fromUid(uid);

  const model = ModelUtils.byId(definition, id ?? '');

  if (!model) {
    return <NotFoundCard />;
  }

  return (
    <div
      className="relative flex h-full flex-1 flex-col overflow-hidden"
      key={id}
    >
      <div className="max-w-7xl space-y-4 px-4 pb-4">
        <ModelHeaderBar model={model} />
        <NavigationTabs>
          <NavigationTabsItem asChild>
            <NavLink to="" end>
              Fields
            </NavLink>
          </NavigationTabsItem>
          <NavigationTabsItem asChild>
            <NavLink to="service">Service</NavLink>
          </NavigationTabsItem>
          <NavigationTabsItem asChild>
            <NavLink to="graphql">GraphQL</NavLink>
          </NavigationTabsItem>
        </NavigationTabs>
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
