import type { RouteObject } from 'react-router-dom';

import { pluginEntityType } from '@halfdomelabs/project-builder-lib';

import { createCrumbFromUid } from '#src/types/routes.js';

import NotFoundPage from '../NotFound.page.js';
import { PluginsHomePage } from './home.page.js';
import { PluginConfigPage } from './plugin-config.page.js';
import PluginsLayout from './PluginsLayout.js';

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
