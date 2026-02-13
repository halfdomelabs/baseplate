import type { IconElement } from '@baseplate-dev/ui-components';
import type React from 'react';

import { cn, SheetClose } from '@baseplate-dev/ui-components';
import { createLink } from '@tanstack/react-router';
import { HiDatabase } from 'react-icons/hi';
import { MdApps, MdHome, MdOutlineSettings, MdWidgets } from 'react-icons/md';

interface SidebarNavigationIconProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  icon: IconElement;
  label: React.ReactNode;
}

function SidebarNavigationIcon({
  icon: Icon,
  label,
  ...props
}: SidebarNavigationIconProps): React.JSX.Element {
  return (
    <SheetClose asChild>
      <a
        {...props}
        className={cn(
          `flex items-center gap-4 px-2.5 py-4 text-muted-foreground transition-colors hover:text-accent-foreground aria-[current="page"]:bg-accent/80 aria-[current="page"]:text-accent-foreground`,
          props.className,
        )}
      >
        <Icon className="size-5 transition-all group-hover:scale-110" />
        {label}
      </a>
    </SheetClose>
  );
}

const SidebarNavigationLink = createLink(SidebarNavigationIcon);

export function AppMobileSidebar(): React.JSX.Element {
  return (
    <nav className="grid gap-6 text-lg font-medium">
      <div className="flex items-center space-x-2">
        <img src="/images/logo.png" alt="logo" className="size-12" />
        <h3>Baseplate</h3>
      </div>
      <div>
        <SidebarNavigationLink
          to="/"
          icon={MdHome}
          label="Home"
          activeOptions={{ exact: true }}
        />
        <SidebarNavigationLink to="/packages" icon={MdApps} label="Apps" />
        <SidebarNavigationLink
          to="/data/models"
          icon={HiDatabase}
          label="Models"
        />
        <SidebarNavigationLink to="/plugins" icon={MdWidgets} label="Plugins" />
        <SidebarNavigationLink
          to="/settings"
          icon={MdOutlineSettings}
          label="Settings"
        />
      </div>
    </nav>
  );
}
