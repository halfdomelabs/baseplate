import type React from 'react';

import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  NavigationTabs,
  NavigationTabsItem,
  SidebarLayout,
  SidebarLayoutContent,
  SidebarLayoutSidebar,
} from '@baseplate-dev/ui-components';
import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from '@tanstack/react-router';
import { maxBy } from 'es-toolkit';

import { ErrorBoundary } from '#src/components/error-boundary/error-boundary.js';

import { EnumsSidebarList } from './enums/-components/enums-sidebar-list.js';
import { ModelsSidebarList } from './models/-components/models-sidebar-list.js';

export const Route = createFileRoute('/data')({
  component: DataLayout,
});

function DataLayout(): React.JSX.Element {
  const {
    definition: { models = [], enums = [] },
  } = useProjectDefinition();

  const longestName = maxBy([...models, ...enums], (m) => m.name.length)?.name;

  const modelsActive = useRouterState({
    select: (state) => state.location.pathname.startsWith('/data/models'),
  });
  const enumsActive = useRouterState({
    select: (state) => state.location.pathname.startsWith('/data/enums'),
  });

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
              <Link to="/data/models" from="/">
                Models
              </Link>
            </NavigationTabsItem>
            <NavigationTabsItem asChild>
              <Link to="/data/enums" from="/">
                Enums
              </Link>
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
