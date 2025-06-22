import type { RouteObject } from 'react-router-dom';

import { pluginEntityType } from '@baseplate-dev/project-builder-lib';

import { createCrumbFromUid } from '#src/types/routes.js';

import NotFoundPage from '../not-found.page.js';
import { PluginsHomePage } from './home.page.js';
import { PluginConfigPage } from './plugin-config.page.js';
import PluginsLayout from './plugins-layout.js';

export const PluginRoutes: RouteObject[] = [
  {
    element: <PluginsLayout />,
    children: [
      {
        index: true,
        element: <PluginsHomePage />,
      },
      {
        path: 'edit/:id',
        element: <PluginConfigPage />,
        handle: { crumb: createCrumbFromUid(pluginEntityType, 'Edit Plugin') },
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
];
