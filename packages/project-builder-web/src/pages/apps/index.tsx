import { appEntityType } from '@halfdomelabs/project-builder-lib';
import { RouteObject } from 'react-router-dom';

import AppsLayout from './AppsLayout.page';
import EditAppPage from './edit.page';
import { AppsListPage } from './list.page';
import NewAppPage from './new.page';
import NotFoundPage from '../NotFound.page';
import { createCrumbFromUid } from '@src/types/routes';

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
