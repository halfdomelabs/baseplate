import { ModelUtils, modelEntityType } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { NavigationTabs } from '@halfdomelabs/ui-components';
import { NavLink, Outlet, useParams } from 'react-router-dom';

import { ModelHeaderBar } from './ModelHeaderBar';
import { NotFoundCard } from 'src/components';

export function ModelEditLayout(): JSX.Element {
  const { uid } = useParams<'uid'>();
  const { definition } = useProjectDefinition();

  const id = modelEntityType.fromUid(uid);

  const model = ModelUtils.byId(definition, id ?? '');

  if (!model) {
    return <NotFoundCard />;
  }

  return (
    <div
      className="relative flex h-full flex-1 flex-col overflow-hidden pt-4"
      key={id}
    >
      <div className="space-y-4 border-b pb-4">
        <ModelHeaderBar model={model} className="max-w-7xl" />
        <NavigationTabs className="mx-4">
          <NavigationTabs.Item asChild>
            <NavLink to="" end>
              Fields
            </NavLink>
          </NavigationTabs.Item>
          <NavigationTabs.Item asChild>
            <NavLink to="service">Service</NavLink>
          </NavigationTabs.Item>
          <NavigationTabs.Item asChild>
            <NavLink to="graphql">GraphQL</NavLink>
          </NavigationTabs.Item>
        </NavigationTabs>
      </div>
      <div
        className="mb-[var(--action-bar-height)] flex-1 overflow-y-auto"
        style={
          {
            '--action-bar-height': '65px',
          } as React.CSSProperties
        }
      >
        <Outlet />
      </div>
    </div>
  );
}
