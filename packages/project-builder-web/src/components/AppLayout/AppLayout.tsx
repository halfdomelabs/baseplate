import classNames from 'classnames';
import { Outlet } from 'react-router-dom';

interface AppLayoutProps {
  className?: string;
  topbar?: React.ReactNode;
}

export function AppLayout({ className, topbar }: AppLayoutProps): JSX.Element {
  return (
    <div
      className={classNames('flex h-full flex-col items-stretch', className)}
    >
      {topbar}
      <div className={classNames('flex flex-auto flex-col overflow-auto')}>
        <Outlet />
      </div>
    </div>
  );
}
