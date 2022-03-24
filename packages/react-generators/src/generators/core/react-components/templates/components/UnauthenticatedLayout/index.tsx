// @ts-nocheck
import { Outlet } from 'react-router-dom';

function UnauthenticatedLayout(): JSX.Element {
  return (
    <div className="min-h-full flex items-center justify-center">
      <Outlet />
    </div>
  );
}

export default UnauthenticatedLayout;
