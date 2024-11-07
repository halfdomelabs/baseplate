import { ModelUtils, modelEntityType } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { NavigationTabs } from '@halfdomelabs/ui-components';
import { NavLink, Outlet, useParams } from 'react-router-dom';

import { ModelHeaderBar } from './components/ModelHeaderBar';
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
      className="relative flex h-full flex-1 flex-col overflow-hidden"
      key={id}
    >
      <div className="max-w-7xl space-y-4 px-4 pb-4">
        <ModelHeaderBar model={model} />
        <NavigationTabs>
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
        className="mb-[var(--action-bar-height)] flex flex-1 overflow-y-auto"
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
