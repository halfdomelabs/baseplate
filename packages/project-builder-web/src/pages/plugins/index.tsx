import type { RouteObject } from 'react-router-dom';

import { pluginEntityType } from '@halfdomelabs/project-builder-lib';

import { createCrumbFromUid } from '@src/types/routes';

import NotFoundPage from '../NotFound.page';
import { PluginsHomePage } from './home.page';
import { PluginConfigPage } from './plugin-config.page';
import PluginsLayout from './PluginsLayout';

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
