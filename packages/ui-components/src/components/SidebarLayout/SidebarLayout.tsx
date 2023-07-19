import { clsx } from 'clsx';

export interface SidebarLayoutProps {
  className?: string;
  children: React.ReactNode;
}

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
      className={clsx(
        'flex-shrink-0 overflow-y-auto border-r border-foreground-200 bg-background-100 p-4 dark:border-foreground-600 dark:bg-background-600',
        {
          'w-64': width === 'sm',
          'w-72': width === 'md',
          'w-96': width === 'lg',
        },
        className
      )}
      aria-label="Sidebar"
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
    <div
      className={clsx(
        'w-full flex-auto overflow-y-auto bg-background-50 dark:bg-background-800',
        className
      )}
    >
      {children}
    </div>
  );
};
