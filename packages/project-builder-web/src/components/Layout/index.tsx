import clsx from 'clsx';
import { Outlet } from 'react-router-dom';

interface Props {
  className?: string;
  centered?: boolean;
  noPadding?: boolean;
  sidebar?: React.ReactNode;
}

function Layout({
  className,
  centered,
  noPadding,
  sidebar,
}: Props): JSX.Element {
  return (
    <div className={clsx('flex h-full items-stretch', className)}>
      {sidebar}
      <div
        className={clsx(
          'flex flex-auto flex-col overflow-auto',
          centered && 'items-center justify-center',
          !noPadding && 'p-4',
        )}
      >
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
