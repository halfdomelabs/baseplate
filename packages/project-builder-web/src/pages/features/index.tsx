import { RouteObject } from 'react-router-dom';

import { FeaturesHomePage } from './FeaturesHome.page';
import FeaturesLayout from './FeaturesLayout';
import AuthPage from './auth';
import { ThemeHomePage } from './theme/ThemeHome.page';
import NotFoundPage from '../NotFound.page';

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
        path: 'theme/*',
        element: <ThemeHomePage />,
        handle: { crumb: 'Theme' },
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
];
