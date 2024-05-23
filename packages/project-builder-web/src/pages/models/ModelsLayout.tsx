import { SidebarLayout, Tabs } from '@halfdomelabs/ui-components';
import _ from 'lodash';
import { Outlet } from 'react-router-dom';

import { ModelsSidebarList } from './ModelsSidebarList';
import { EnumsSidebarList } from './enums/EnumsSidebarList';
import { useProjectDefinition } from 'src/hooks/useProjectDefinition';

export function ModelsLayout(): JSX.Element {
  const { parsedProject } = useProjectDefinition();

  const models = parsedProject.getModels();
  const enums = parsedProject.getEnums();
  const longestName = _.maxBy(
    [...models, ...enums],
    (m) => m.name.length,
  )?.name;

  return (
    <SidebarLayout className="flex-1">
      <SidebarLayout.Sidebar
        className="flex h-full max-w-sm flex-col space-y-4"
        width="auto"
      >
        <Tabs defaultValue="models">
          <Tabs.List className="w-full">
            <Tabs.Trigger value="models">Models</Tabs.Trigger>
            <Tabs.Trigger value="enums">Enums</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="models">
            <ModelsSidebarList />
          </Tabs.Content>
          <Tabs.Content value="enums">
            <EnumsSidebarList />
          </Tabs.Content>
        </Tabs>
        {/* Allows us to ensure the width doesn't change when selected is semi-bold or search filter is active */}
        <div className="invisible block h-1 overflow-hidden overflow-y-scroll font-semibold text-transparent">
          {longestName}
        </div>
      </SidebarLayout.Sidebar>
      <div className="relative h-full w-full pb-[65px]">
        <SidebarLayout.Content className="h-full p-4">
          <Outlet />
        </SidebarLayout.Content>
      </div>
    </SidebarLayout>
  );
}
