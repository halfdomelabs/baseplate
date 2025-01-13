import { createBrowserRouter } from 'react-router-dom';

import App from '@src/app/App';
import { AppLayout } from '@src/app/AppLayout/AppLayout';
import { createRouteCrumb } from '@src/types/routes';

import { AppsRoutes } from './apps';
import { DataRoutes } from './data/_routes';
import { FeatureRoutes } from './features';
import HomePage from './home/home.page';
import { NotFoundRoute } from './NotFound.page';
import { PluginRoutes } from './plugins';
import { SettingsRoutes } from './settings/_routes';

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/',
            element: <HomePage />,
            handle: {
              crumb: createRouteCrumb({ label: 'Home', url: '/' }),
            },
          },
          {
            path: '/apps/*',
            children: AppsRoutes,
            handle: {
              crumb: createRouteCrumb({ label: 'Apps', url: '/apps' }),
            },
          },
          DataRoutes,
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
          SettingsRoutes,
          NotFoundRoute,
        ],
      },
    ],
  },
]);
