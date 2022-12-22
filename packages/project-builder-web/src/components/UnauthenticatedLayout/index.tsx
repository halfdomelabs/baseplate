import { Outlet } from 'react-router-dom';

function UnauthenticatedLayout(): JSX.Element {
  return (
    <div className="flex min-h-full items-center justify-center">
      <Outlet />
    </div>
  );
}

export default UnauthenticatedLayout;
