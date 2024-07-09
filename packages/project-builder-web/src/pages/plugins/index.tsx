import { pluginEntityType } from '@halfdomelabs/project-builder-lib';
import { RouteObject } from 'react-router-dom';

import PluginsLayout from './PluginsLayout';
import { PluginsHomePage } from './home.page';
import { PluginConfigPage } from './plugin-config.page';
import NotFoundPage from '../NotFound.page';
import { createCrumbFromUid } from '@src/types/routes';

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
