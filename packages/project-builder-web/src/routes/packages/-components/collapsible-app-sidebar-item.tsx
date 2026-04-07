import type React from 'react';

import { adminSectionEntityType } from '@baseplate-dev/project-builder-lib';
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SidebarMenu,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@baseplate-dev/ui-components';
import { Link, useLocation } from '@tanstack/react-router';
import { sortBy } from 'es-toolkit';
import { useEffect, useState } from 'react';
import { MdAdd, MdExpandMore } from 'react-icons/md';

import NewAdminSectionDialog from '../apps.$key/admin-sections/-components/new-admin-section-dialog.js';

interface CollapsibleAppSidebarItemProps {
  appId: string;
  appName: string;
  appKey: string;
  sections: readonly { id: string; name: string }[];
}

function CollapsibleAppSidebarItem({
  appId,
  appName,
  appKey,
  sections,
}: CollapsibleAppSidebarItemProps): React.ReactElement {
  const appBasePath = `/packages/apps/${appKey}`;

  const { pathname } = useLocation();
  const isChildActive =
    pathname === appBasePath || pathname.startsWith(`${appBasePath}/`);

  const [isOpen, setIsOpen] = useState(isChildActive);

  // Force open when a child route becomes active (e.g. direct URL navigation)
  useEffect(() => {
    if (isChildActive) {
      setIsOpen(true);
    }
  }, [isChildActive]);

  const sortedSections = sortBy([...sections], [(s) => s.name]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="group/collapsible flex w-full items-center gap-2 rounded-md p-2 text-left text-sm font-medium hover:bg-accent hover:text-accent-foreground data-panel-open:text-accent-foreground [&>svg]:shrink-0">
        <span className="truncate">{appName}</span>
        <MdExpandMore className="ml-auto size-4 -rotate-90 transition-transform duration-200 group-data-panel-open/collapsible:rotate-0" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenu>
          <SidebarMenuSub>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton
                render={
                  <Link
                    to="/packages/apps/$key/web"
                    params={{ key: appKey }}
                    activeOptions={{ exact: true }}
                  />
                }
              >
                <span>General</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton
                render={
                  <Link
                    to="/packages/apps/$key/web/admin"
                    params={{ key: appKey }}
                    activeOptions={{ exact: true }}
                  />
                }
              >
                <span>Admin Config</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
            {sortedSections.map((section) => {
              const sectionKey = adminSectionEntityType.keyFromId(section.id);
              return (
                <SidebarMenuSubItem key={section.id}>
                  <SidebarMenuSubButton
                    render={
                      <Link
                        to="/packages/apps/$key/admin-sections/$section-key"
                        params={{ key: appKey, 'section-key': sectionKey }}
                      />
                    }
                  >
                    <span>{section.name}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
            <SidebarMenuSubItem>
              <NewAdminSectionDialog
                appId={appId}
                appKey={appKey}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-full justify-start gap-2 px-2 text-muted-foreground"
                  >
                    <MdAdd className="size-4" />
                    <span>New Section</span>
                  </Button>
                }
              />
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
}

export { CollapsibleAppSidebarItem };
