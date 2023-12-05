import { SidebarLayout, Tabs } from '@halfdomelabs/ui-components';
import _ from 'lodash';
import { Outlet } from 'react-router-dom';

import { ModelsLayoutFooter } from './ModelsLayoutFooter';
import { ModelsSidebarList } from './ModelsSidebarList';
import { ModelsFooterContentProvider } from './context/ModelsFooterContentContext';
import { EnumsSidebarList } from './enums/EnumsSidebarList';
import { useProjectConfig } from 'src/hooks/useProjectConfig';

export function ModelsLayout(): JSX.Element {
  const { parsedProject } = useProjectConfig();

  const models = parsedProject.getModels();
  const enums = parsedProject.getEnums();
  const longestName = _.maxBy([...models, ...enums], (m) => m.name.length)
    ?.name;

  return (
    <SidebarLayout className="relative flex-1">
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
      <div className="flex h-full w-full max-w-full flex-col">
        <ModelsFooterContentProvider>
          <SidebarLayout.Content className="p-4">
            <Outlet />
          </SidebarLayout.Content>
          <ModelsLayoutFooter />
        </ModelsFooterContentProvider>
      </div>
    </SidebarLayout>
  );
}
