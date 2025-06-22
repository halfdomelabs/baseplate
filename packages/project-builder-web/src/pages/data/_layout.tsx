import type React from 'react';

import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  NavigationTabs,
  NavigationTabsItem,
  SidebarLayout,
  SidebarLayoutContent,
  SidebarLayoutSidebar,
} from '@baseplate-dev/ui-components';
import { maxBy } from 'es-toolkit';
import { NavLink, Outlet, useMatch } from 'react-router-dom';

import { ErrorBoundary } from '#src/components/error-boundary/error-boundary.js';

import { EnumsSidebarList } from './enums/enums-sidebar-list.js';
import { ModelsSidebarList } from './models/_components/models-sidebar-list.js';

export function DataLayout(): React.JSX.Element {
  const {
    definition: { models = [], enums = [] },
  } = useProjectDefinition();

  const longestName = maxBy([...models, ...enums], (m) => m.name.length)?.name;

  const modelsActive = useMatch('/data/models/*');
  const enumsActive = useMatch('/data/enums/*');

  return (
    <SidebarLayout className="flex-1">
      <SidebarLayoutSidebar
        className="flex h-[calc(100vh-var(--topbar-height)-1px)] max-w-sm min-w-[230px] flex-col space-y-4"
        width="auto"
        noPadding
      >
        {/* Allows us to ensure the width doesn't change when selected is semi-bold or search filter is active */}
        <div className="invisible block h-1 overflow-hidden font-semibold text-transparent">
          {longestName}
        </div>
        <div className="px-4">
          <NavigationTabs className="w-full">
            <NavigationTabsItem asChild>
              <NavLink to="models">Models</NavLink>
            </NavigationTabsItem>
            <NavigationTabsItem asChild>
              <NavLink to="enums">Enums</NavLink>
            </NavigationTabsItem>
          </NavigationTabs>
        </div>
        {modelsActive ? <ModelsSidebarList /> : null}
        {enumsActive ? <EnumsSidebarList /> : null}
      </SidebarLayoutSidebar>
      <SidebarLayoutContent className="h-[calc(100vh-var(--topbar-height)-1px)]">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </SidebarLayoutContent>
    </SidebarLayout>
  );
}
