import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { SidebarLayout } from '@halfdomelabs/ui-components';
import _ from 'lodash';
import { Outlet, useMatch } from 'react-router-dom';

import { EnumsSidebarList } from './enums/EnumsSidebarList';
import { ModelsSidebarList } from './models/ModelsSidebarList';
import { TabNavigation } from '@src/components/TabNavigation/TabNavigation';

export function DataLayout(): JSX.Element {
  const { parsedProject } = useProjectDefinition();

  const models = parsedProject.getModels();
  const enums = parsedProject.getEnums();
  const longestName = _.maxBy(
    [...models, ...enums],
    (m) => m.name.length,
  )?.name;

  const modelsActive = useMatch('/data/models/*');
  const enumsActive = useMatch('/data/enums/*');

  return (
    <SidebarLayout className="flex-1">
      <SidebarLayout.Sidebar
        className="flex h-full max-w-sm flex-col space-y-4"
        width="auto"
      >
        <TabNavigation.Container className="w-full">
          <TabNavigation.Link to="./models">Models</TabNavigation.Link>
          <TabNavigation.Link to="./enums">Enums</TabNavigation.Link>
        </TabNavigation.Container>
        {modelsActive ? <ModelsSidebarList /> : null}
        {enumsActive ? <EnumsSidebarList /> : null}
        {/* Allows us to ensure the width doesn't change when selected is semi-bold or search filter is active */}
        <div className="invisible block h-1 overflow-hidden overflow-y-scroll font-semibold text-transparent">
          {longestName}
        </div>
      </SidebarLayout.Sidebar>
      <div className="relative size-full pb-[65px]">
        <SidebarLayout.Content className="h-full p-4">
          <Outlet />
        </SidebarLayout.Content>
      </div>
    </SidebarLayout>
  );
}
