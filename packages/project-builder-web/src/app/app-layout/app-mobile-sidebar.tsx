import type { IconElement } from '@baseplate-dev/ui-components';
import type React from 'react';

import { SheetClose } from '@baseplate-dev/ui-components';
import { Link } from '@tanstack/react-router';
import { HiDatabase } from 'react-icons/hi';
import { MdApps, MdHome, MdOutlineSettings, MdWidgets } from 'react-icons/md';

function SidebarNavigationIcon({
  icon: Icon,
  to,
  label,
  exact,
}: {
  to: string;
  icon: IconElement;
  label: React.ReactNode;
  exact?: boolean;
}): React.JSX.Element {
  return (
    <SheetClose asChild>
      <Link
        to={to}
        activeOptions={{
          exact,
        }}
        className={`flex items-center gap-4 px-2.5 py-4 text-muted-foreground transition-colors hover:text-accent-foreground aria-[current="page"]:bg-accent/80 aria-[current="page"]:text-accent-foreground`}
      >
        <Icon className="size-5 transition-all group-hover:scale-110" />
        {label}
      </Link>
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
        <SidebarNavigationIcon to="/" icon={MdHome} label="Home" exact />
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
