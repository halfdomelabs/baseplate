import type React from 'react';

import {
  modelEntityType,
  ModelUtils,
} from '@baseplate-dev/project-builder-lib';
import {
  NavigationTabs,
  NavigationTabsItem,
} from '@baseplate-dev/ui-components';
import {
  createFileRoute,
  Link,
  notFound,
  Outlet,
} from '@tanstack/react-router';

import { ModelHeaderBar } from './-components/model-header-bar.js';

export const Route = createFileRoute('/data/models/edit/$key')({
  component: ModelEditLayout,
  beforeLoad: ({ params: { key }, context: { projectDefinition } }) => {
    const id = modelEntityType.idFromKey(key);
    const model = ModelUtils.byId(projectDefinition, id);
    if (!model) return {};
    return {
      getTitle: () => model.name,
      model,
    };
  },
  loader: ({ context: { model } }) => {
    if (!model) throw notFound();
    return { model };
  },
});

function ModelEditLayout(): React.JSX.Element {
  const { model } = Route.useLoaderData();
  const { key } = Route.useParams();

  return (
    <div
      className="relative flex h-full flex-1 flex-col overflow-hidden"
      key={model.id}
    >
      <div className="max-w-7xl space-y-4 px-4 pb-4">
        <ModelHeaderBar model={model} />
        <NavigationTabs>
          <NavigationTabsItem asChild>
            <Link
              to="/data/models/edit/$key"
              from="/"
              params={{ key }}
              activeOptions={{ exact: true }}
            >
              Fields
            </Link>
          </NavigationTabsItem>
          <NavigationTabsItem asChild>
            <Link
              to="/data/models/edit/$key/service"
              from="/"
              params={{ key }}
              activeOptions={{ exact: true }}
            >
              Service
            </Link>
          </NavigationTabsItem>
          <NavigationTabsItem asChild>
            <Link
              to="/data/models/edit/$key/graphql"
              from="/"
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
