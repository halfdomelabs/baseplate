import clsx from 'clsx';
import { Outlet } from 'react-router-dom';

interface AppLayoutProps {
  className?: string;
  topbar?: React.ReactNode;
}

export function AppLayout({ className, topbar }: AppLayoutProps): JSX.Element {
  return (
    <div className={clsx('flex h-full flex-col items-stretch', className)}>
      {topbar}
      <div className={clsx('flex flex-auto overflow-auto')}>
        <Outlet />
      </div>
    </div>
  );
}
