import { IconElement } from '@halfdomelabs/ui-components';
import React from 'react';
import { HiCollection, HiDatabase } from 'react-icons/hi';
import { MdApps, MdOutlineSettings, MdWidgets } from 'react-icons/md';
import { Link, NavLink } from 'react-router-dom';

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
}): JSX.Element {
  return (
    <NavLink
      to={to}
      className={`flex h-12 w-[50px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground aria-[current="page"]:bg-accent/80 aria-[current="page"]:text-accent-foreground aria-[current="page"]:hover:bg-accent`}
      end={end}
    >
      <div className="flex flex-col items-center space-y-1">
        <Icon className="size-5" />
        <div className="text-xs font-medium">{label}</div>
      </div>
    </NavLink>
  );
}

export function AppDesktopSidebar(): JSX.Element {
  return (
    <nav className="flex h-full flex-col items-center justify-between px-2 pb-4 pt-2.5">
      <div className="space-y-8">
        <Link
          to="/"
          className="group flex shrink-0 items-center justify-center"
        >
          <img
            src="/images/logo.png"
            className="size-8 transition-all group-hover:scale-110"
            alt="Baseplate Home"
          />
        </Link>
        <div className="space-y-2">
          <SidebarNavigationIcon to="/apps" icon={MdApps} label="Apps" />
          <SidebarNavigationIcon to="/data" icon={HiDatabase} label="Data" />
          <SidebarNavigationIcon
            to="/features"
            icon={HiCollection}
            label="Features"
          />
          <SidebarNavigationIcon
            to="/plugins"
            icon={MdWidgets}
            label="Plugins"
          />
          <SidebarNavigationIcon
            to="/settings"
            icon={MdOutlineSettings}
            label="Settings"
          />
        </div>
      </div>
    </nav>
  );
}
