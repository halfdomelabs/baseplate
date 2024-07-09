import { createBrowserRouter } from 'react-router-dom';

import NotFoundPage from './NotFound.page';
import { AppsRoutes } from './apps';
import { FeatureRoutes } from './features';
import HomePage from './home/home.page';
import { ModelRoutes } from './models';
import { PluginRoutes } from './plugins';
import SettingsPage from './settings';
import App from '@src/app/App';
import { AppLayout } from '@src/app/AppLayout/AppLayout';
import { createRouteCrumb } from '@src/types/routes';

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          {
            path: '/apps/*',
            children: AppsRoutes,
            handle: {
              crumb: createRouteCrumb({ label: 'Apps', url: '/apps' }),
            },
          },
          {
            path: '/models/*',
            children: ModelRoutes,
            handle: {
              crumb: createRouteCrumb({ label: 'Models', url: '/models' }),
            },
          },
          {
            path: '/features/*',
            children: FeatureRoutes,
            handle: {
              crumb: createRouteCrumb({ label: 'Features', url: '/features' }),
            },
          },
          {
            path: '/plugins/*',
            children: PluginRoutes,
            handle: {
              crumb: createRouteCrumb({ label: 'Plugins', url: '/plugins' }),
            },
          },
          {
            path: '/settings',
            element: <SettingsPage />,
            handle: {
              crumb: 'Settings',
            },
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
