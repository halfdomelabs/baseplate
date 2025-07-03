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
import { createFileRoute, Link, Outlet } from '@tanstack/react-router';

import { NotFoundCard } from '#src/components/index.js';

import { ModelHeaderBar } from './-components/model-header-bar.js';

export const Route = createFileRoute('/data/models/edit/$key')({
  component: ModelEditLayout,
});

export function ModelEditLayout(): React.JSX.Element {
  const { key } = Route.useParams();
  const { definition } = useProjectDefinition();

  const id = modelEntityType.idFromKey(key);

  const model = ModelUtils.byId(definition, id);

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
            <Link
              to="/data/models/edit/$key"
              params={{ key }}
              activeOptions={{ exact: true }}
            >
              Fields
            </Link>
          </NavigationTabsItem>
          <NavigationTabsItem asChild>
            <Link
              to="/data/models/edit/$key/service"
              params={{ key }}
              activeOptions={{ exact: true }}
            >
              Service
            </Link>
          </NavigationTabsItem>
          <NavigationTabsItem asChild>
            <Link
              to="/data/models/edit/$key/graphql"
              params={{ key }}
              activeOptions={{ exact: true }}
            >
              GraphQL
            </Link>
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
