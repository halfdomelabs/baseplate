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
            <NavigationMenuLink asChild>
              <Link to={`/settings`} from="/">
                Project settings
              </Link>
            </NavigationMenuLink>
            <NavigationMenuLink asChild>
              <Link to={`/settings/hierarchy`} from="/">
                Hierarchy
              </Link>
            </NavigationMenuLink>
            <NavigationMenuLink asChild>
              <Link to={`/settings/theme-builder`} from="/">
                Theme builder
              </Link>
            </NavigationMenuLink>
            {ENABLE_TEMPLATE_EXTRACTOR && (
              <NavigationMenuLink asChild>
                <Link to={`/settings/template-extractor`} from="/">
                  Template extractor
                </Link>
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
