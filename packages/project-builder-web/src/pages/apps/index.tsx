import type { RouteObject } from 'react-router-dom';

import { appEntityType } from '@baseplate-dev/project-builder-lib';

import { createCrumbFromUid } from '#src/types/routes.js';

import NotFoundPage from '../NotFound.page.js';
import AppsLayout from './AppsLayout.page.js';
import EditAppPage from './edit.page.js';
import { AppsListPage } from './list.page.js';
import NewAppPage from './new.page.js';

export const AppsRoutes: RouteObject[] = [
  {
    element: <AppsLayout />,
    children: [
      { index: true, element: <AppsListPage /> },
      { path: 'new', element: <NewAppPage />, handle: { crumb: 'New App' } },
      {
        path: 'edit/:uid/*',
        element: <EditAppPage />,
        handle: {
          crumb: createCrumbFromUid(appEntityType, 'Edit App'),
        },
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
