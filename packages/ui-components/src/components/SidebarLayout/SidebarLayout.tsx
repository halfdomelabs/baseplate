import { clsx } from 'clsx';

import { cn } from '@src/utils';

export interface SidebarLayoutProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Displays a 2 column layout with a sidebar and content.
 */
export function SidebarLayout({
  className,
  children,
}: SidebarLayoutProps): JSX.Element {
  return <div className={clsx('flex', className)}>{children}</div>;
}

interface SidebarLayoutSidebarProps {
  className?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'auto';
}

SidebarLayout.Sidebar = function SidebarLayoutSidebar({
  className,
  children,
  width = 'md',
}: SidebarLayoutSidebarProps): JSX.Element {
  return (
    <aside
      className={cn(
        'flex-shrink-0 overflow-y-auto border-r border-border p-4',
        {
          'w-64': width === 'sm',
          'w-72': width === 'md',
          'w-96': width === 'lg',
        },
        className,
      )}
    >
      {children}
    </aside>
  );
};

interface SidebarLayoutContentProps {
  className?: string;
  children: React.ReactNode;
}

SidebarLayout.Content = function SidebarLayoutContent({
  className,
  children,
}: SidebarLayoutContentProps): JSX.Element {
  return (
    <div className={cn('w-full flex-auto overflow-y-auto', className)}>
      {children}
    </div>
  );
};
