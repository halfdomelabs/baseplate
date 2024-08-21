import { RouteObject } from 'react-router-dom';

import { NotFoundCard } from 'src/components';

function NotFoundPage(): JSX.Element {
  return <NotFoundCard />;
}

export default NotFoundPage;

export const NotFoundRoute: RouteObject = {
  path: '*',
  element: <NotFoundPage />,
};
