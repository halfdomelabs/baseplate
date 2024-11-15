import type React from 'react';

import { Outlet } from 'react-router-dom';

function UnauthenticatedLayout(): React.JSX.Element {
  return (
    <div className="flex min-h-full items-center justify-center">
      <Outlet />
    </div>
  );
}

export default UnauthenticatedLayout;
