import type React from 'react';

import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { NavigationTabs, SidebarLayout } from '@halfdomelabs/ui-components';
import { maxBy } from 'es-toolkit';
import { NavLink, Outlet, useMatch } from 'react-router-dom';

import { ErrorBoundary } from '@src/components/ErrorBoundary/ErrorBoundary';

import { EnumsSidebarList } from './enums/EnumsSidebarList';
import { ModelsSidebarList } from './models/_components/ModelsSidebarList';

export function DataLayout(): React.JSX.Element {
  const {
    definition: { models = [], enums = [] },
  } = useProjectDefinition();

  const longestName = maxBy([...models, ...enums], (m) => m.name.length)?.name;

  const modelsActive = useMatch('/data/models/*');
  const enumsActive = useMatch('/data/enums/*');

  return (
    <SidebarLayout className="flex-1">
      <SidebarLayout.Sidebar
        className="flex h-[calc(100vh-var(--topbar-height)-1px)] min-w-[230px] max-w-sm flex-col space-y-4"
        width="auto"
        noPadding
      >
        {/* Allows us to ensure the width doesn't change when selected is semi-bold or search filter is active */}
        <div className="invisible block h-1 overflow-hidden font-semibold text-transparent">
          {longestName}
        </div>
        <div className="px-4">
          <NavigationTabs className="w-full">
            <NavigationTabs.Item asChild>
              <NavLink to="models">Models</NavLink>
            </NavigationTabs.Item>
            <NavigationTabs.Item asChild>
              <NavLink to="enums">Enums</NavLink>
            </NavigationTabs.Item>
          </NavigationTabs>
        </div>
        {modelsActive ? <ModelsSidebarList /> : null}
        {enumsActive ? <EnumsSidebarList /> : null}
      </SidebarLayout.Sidebar>
      <SidebarLayout.Content className="h-[calc(100vh-var(--topbar-height)-1px)]">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </SidebarLayout.Content>
    </SidebarLayout>
  );
}
