import type { RouteObject } from 'react-router-dom';

import { appEntityType } from '@baseplate-dev/project-builder-lib';

import { createCrumbFromKey } from '#src/types/routes.js';

import NotFoundPage from '../not-found.page.js';
import AppsLayout from './apps-layout.page.js';
import EditAppPage from './edit.page.js';
import { AppsListPage } from './list.page.js';

export const AppsRoutes: RouteObject[] = [
  {
    element: <AppsLayout />,
    children: [
      { index: true, element: <AppsListPage /> },
      {
        path: 'edit/:key/*',
        element: <EditAppPage />,
        handle: {
          crumb: createCrumbFromKey(appEntityType, 'Edit App'),
        },
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
