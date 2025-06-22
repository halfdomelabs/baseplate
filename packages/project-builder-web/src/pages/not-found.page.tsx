import type React from 'react';
import type { RouteObject } from 'react-router-dom';

import { NotFoundCard } from '#src/components/index.js';

function NotFoundPage(): React.JSX.Element {
  return <NotFoundCard />;
}

export default NotFoundPage;

export const NotFoundRoute: RouteObject = {
  path: '*',
  element: <NotFoundPage />,
};
