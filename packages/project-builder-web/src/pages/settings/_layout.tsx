import type React from 'react';

import {
  NavigationMenu,
  NavigationMenuLink,
  NavigationMenuList,
  SidebarLayout,
  SidebarLayoutContent,
  SidebarLayoutSidebar,
} from '@halfdomelabs/ui-components';
import { NavLink, Outlet } from 'react-router-dom';

import { ENABLE_TEMPLATE_EXTRACTOR } from '#src/services/config.js';

function SettingsLayout(): React.JSX.Element {
  return (
    <SidebarLayout className="h-full flex-1">
      <SidebarLayoutSidebar className="space-y-4" width="sm">
        <NavigationMenu orientation="vertical">
          <NavigationMenuList>
            <NavigationMenuLink asChild>
              <NavLink to={`/settings/project-settings`}>
                Project settings
              </NavLink>
            </NavigationMenuLink>
            <NavigationMenuLink asChild>
              <NavLink to={`/settings/hierarchy`}>Hierarchy</NavLink>
            </NavigationMenuLink>
            <NavigationMenuLink asChild>
              <NavLink to={`/settings/theme-builder`}>Theme builder</NavLink>
            </NavigationMenuLink>
            {ENABLE_TEMPLATE_EXTRACTOR && (
              <NavigationMenuLink asChild>
                <NavLink to={`/settings/template-extractor`}>
                  Template extractor
                </NavLink>
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

export default SettingsLayout;
