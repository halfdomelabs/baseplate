import { createBrowserRouter } from 'react-router-dom';

import { createRouteCrumb } from '#src/types/routes.js';

import { AppLayout } from '../app/app-layout/app-layout.js';
import App from '../app/app.js';
import { AppsRoutes } from './apps/index.js';
import { DataRoutes } from './data/_routes.js';
import HomePage from './home/home.page.js';
import { NotFoundRoute } from './not-found.page.js';
import { PluginRoutes } from './plugins/index.js';
import { SettingsRoutes } from './settings/_routes.js';

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
