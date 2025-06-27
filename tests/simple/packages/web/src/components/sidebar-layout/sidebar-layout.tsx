import type React from 'react';

import { clsx } from 'clsx';

import { cn } from '@src/utils/cn';

export interface SidebarLayoutProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Displays a 2 column layout with a sidebar and content.
 */
function SidebarLayout({
  className,
  children,
}: SidebarLayoutProps): React.ReactElement {
  return <div className={clsx('flex h-full', className)}>{children}</div>;
}

interface SidebarLayoutSidebarProps {
  className?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'auto';
  noPadding?: boolean;
}

function SidebarLayoutSidebar({
  className,
  children,
  width = 'md',
  noPadding,
}: SidebarLayoutSidebarProps): React.ReactElement {
  return (
    <aside
      className={cn(
        'border-border sticky shrink-0 overflow-y-auto border-r',
        {
          'w-64': width === 'sm',
          'w-72': width === 'md',
          'w-96': width === 'lg',
          'p-4': !noPadding,
        },
        className,
      )}
    >
      {children}
    </aside>
  );
}

interface SidebarLayoutContentProps {
  className?: string;
  children: React.ReactNode;
}

function SidebarLayoutContent({
  className,
  children,
}: SidebarLayoutContentProps): React.ReactElement {
  return (
    <div className={cn('w-full flex-auto overflow-y-auto', className)}>
      {children}
    </div>
  );
}

export { SidebarLayout, SidebarLayoutContent, SidebarLayoutSidebar };
