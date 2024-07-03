import { RouteObject } from 'react-router-dom';

import PluginsLayout from './PluginsLayout';
import { PluginsHomePage } from './home.page';
import NotFoundPage from '../NotFound.page';

export const PluginRoutes: RouteObject[] = [
  {
    element: <PluginsLayout />,
    children: [
      {
        index: true,
        element: <PluginsHomePage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
];
