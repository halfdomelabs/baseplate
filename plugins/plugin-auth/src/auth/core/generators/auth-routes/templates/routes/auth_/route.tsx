// @ts-nocheck

import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/auth_')({
  component: RouteComponent,
});

function RouteComponent(): React.ReactElement {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  );
}
