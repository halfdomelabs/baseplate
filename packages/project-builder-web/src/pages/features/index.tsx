import type { RouteObject } from 'react-router-dom';

import NotFoundPage from '../NotFound.page';
import AuthPage from './auth';
import { FeaturesHomePage } from './FeaturesHome.page';
import FeaturesLayout from './FeaturesLayout';

export const FeatureRoutes: RouteObject[] = [
  {
    element: <FeaturesLayout />,
    children: [
      {
        index: true,
        element: <FeaturesHomePage />,
      },
      {
        path: 'auth',
        element: <AuthPage />,
        handle: { crumb: 'Auth' },
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
];
