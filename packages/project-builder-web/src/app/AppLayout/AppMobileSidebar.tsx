import type { IconElement } from '@baseplate-dev/ui-components';
import type React from 'react';

import { SheetClose } from '@baseplate-dev/ui-components';
import { HiDatabase } from 'react-icons/hi';
import { MdApps, MdHome, MdOutlineSettings, MdWidgets } from 'react-icons/md';
import { NavLink } from 'react-router-dom';

function SidebarNavigationIcon({
  icon: Icon,
  to,
  label,
  end,
}: {
  to: string;
  icon: IconElement;
  label: React.ReactNode;
  end?: boolean;
}): React.JSX.Element {
  return (
    <SheetClose asChild>
      <NavLink
        to={to}
        className={`flex items-center gap-4 px-2.5 py-4 text-muted-foreground transition-colors hover:text-accent-foreground aria-[current="page"]:bg-accent/80 aria-[current="page"]:text-accent-foreground`}
        end={end}
      >
        <Icon className="size-5 transition-all group-hover:scale-110" />
        {label}
      </NavLink>
    </SheetClose>
  );
}

export function AppMobileSidebar(): React.JSX.Element {
  return (
    <nav className="grid gap-6 text-lg font-medium">
      <div className="flex items-center space-x-2">
        <img src="/images/logo.png" alt="logo" className="size-12" />
        <h3>Baseplate</h3>
      </div>
      <div>
        <SidebarNavigationIcon to="/" icon={MdHome} label="Home" end />
        <SidebarNavigationIcon to="/apps" icon={MdApps} label="Apps" />
        <SidebarNavigationIcon
          to="/data/models"
          icon={HiDatabase}
          label="Models"
        />
        <SidebarNavigationIcon to="/plugins" icon={MdWidgets} label="Plugins" />
        <SidebarNavigationIcon
          to="/settings"
          icon={MdOutlineSettings}
          label="Settings"
        />
      </div>
    </nav>
  );
}
