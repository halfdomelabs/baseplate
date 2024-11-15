import type { RouteObject } from 'react-router-dom';

import { modelEntityType } from '@halfdomelabs/project-builder-lib';

import { NotFoundRoute } from '@src/pages/NotFound.page';
import { createCrumbFromUid, createRouteCrumb } from '@src/types/routes';

import { ModelEditLayout } from '../edit.id/_layout';
import ModelEditModelPage from '../edit.id/index.page';
import ModelEditServicePage from '../edit.id/service.page';

export const ModelEditRoutes: RouteObject = {
  path: 'edit/:uid/*',
  element: <ModelEditLayout />,
  handle: {
    crumb: createCrumbFromUid(
      modelEntityType,
      'Edit Model',
      '/data/models/edit/:uid',
    ),
  },
  children: [
    { index: true, element: <ModelEditModelPage /> },
    {
      path: 'service',
      element: <ModelEditServicePage />,
      handle: {
        crumb: createRouteCrumb('Service'),
      },
    },
    {
      path: 'graphql',
      element: <ModelEditServicePage />,
      handle: {
        crumb: createRouteCrumb('GraphQL'),
      },
    },
    NotFoundRoute,
  ],
};
