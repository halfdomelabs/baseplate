import type React from 'react';

import {
  NavigationMenu,
  NavigationMenuLink,
  NavigationMenuList,
  SidebarLayout,
  SidebarLayoutContent,
  SidebarLayoutSidebar,
} from '@baseplate-dev/ui-components';
import { createFileRoute, Link, Outlet } from '@tanstack/react-router';

import { ENABLE_TEMPLATE_EXTRACTOR } from '#src/services/config.js';

export const Route = createFileRoute('/settings')({
  component: SettingsLayout,
  beforeLoad: () => ({
    getTitle: () => 'Settings',
  }),
});

function SettingsLayout(): React.JSX.Element {
  return (
    <SidebarLayout className="h-full flex-1">
      <SidebarLayoutSidebar className="space-y-4" width="sm">
        <NavigationMenu orientation="vertical">
          <NavigationMenuList>
            <NavigationMenuLink render={<Link to={`/settings`} />}>
              Project settings
            </NavigationMenuLink>
            <NavigationMenuLink render={<Link to={`/settings/hierarchy`} />}>
              Hierarchy
            </NavigationMenuLink>
            <NavigationMenuLink
              render={<Link to={`/settings/infrastructure`} />}
            >
              Infrastructure
            </NavigationMenuLink>
            <NavigationMenuLink render={<Link to={`/settings/monorepo`} />}>
              Monorepo
            </NavigationMenuLink>
            <NavigationMenuLink
              render={<Link to={`/settings/theme-builder`} />}
            >
              Theme builder
            </NavigationMenuLink>
            {ENABLE_TEMPLATE_EXTRACTOR && (
              <NavigationMenuLink
                render={<Link to={`/settings/template-extractor`} />}
              >
                Template extractor
              </NavigationMenuLink>
            )}
          </NavigationMenuList>
        </NavigationMenu>
      </SidebarLayoutSidebar>
      <SidebarLayoutContent className="h-full">
        <Outlet />
      </SidebarLayoutContent>
    </SidebarLayout>
  );
}
