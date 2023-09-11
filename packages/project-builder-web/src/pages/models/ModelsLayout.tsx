import { SidebarLayout, ToggleTabs } from '@halfdomelabs/ui-components';
import _ from 'lodash';
import { Outlet } from 'react-router-dom';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { ModelsSidebarList } from './ModelsSidebarList';
import { EnumsSidebarList } from './enums/EnumsSidebarList';

export function ModelsLayout(): JSX.Element {
  const { parsedProject } = useProjectConfig();

  const models = parsedProject.getModels();
  const enums = parsedProject.getEnums();
  const longestName = _.maxBy([...models, ...enums], (m) => m.name.length)
    ?.name;

  return (
    <SidebarLayout className="flex-1">
      <SidebarLayout.Sidebar
        className="flex h-full max-w-sm flex-col space-y-4"
        width="auto"
      >
        <ToggleTabs defaultValue="models">
          <ToggleTabs.List className="w-full">
            <ToggleTabs.Trigger value="models">Models</ToggleTabs.Trigger>
            <ToggleTabs.Trigger value="enums">Enums</ToggleTabs.Trigger>
          </ToggleTabs.List>
          <ToggleTabs.Content value="models">
            <ModelsSidebarList />
          </ToggleTabs.Content>
          <ToggleTabs.Content value="enums">
            <EnumsSidebarList />
          </ToggleTabs.Content>
        </ToggleTabs>
        {/* Allows us to ensure the width doesn't change when selected is semi-bold or search filter is active */}
        <div className="invisible block h-1 overflow-hidden overflow-y-scroll font-semibold text-transparent">
          {longestName}
        </div>
      </SidebarLayout.Sidebar>
      <SidebarLayout.Content className="p-4">
        <Outlet />
      </SidebarLayout.Content>
    </SidebarLayout>
  );
}
