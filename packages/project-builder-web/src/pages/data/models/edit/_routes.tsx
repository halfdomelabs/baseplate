import type { RouteObject } from 'react-router-dom';

import { modelEntityType } from '@halfdomelabs/project-builder-lib';

import { NotFoundRoute } from '@src/pages/NotFound.page';
import { createCrumbFromUid, createRouteCrumb } from '@src/types/routes';

import ModelEditModelPage from './model/model.page';
import { ModelEditLayout } from './ModelEditLayout';
import ModelEditSchemaPage from './schema/schema.page';
import ModelEditServicePage from './service/service.page';

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
      element: <ModelEditSchemaPage />,
      handle: {
        crumb: createRouteCrumb('GraphQL'),
      },
    },
    NotFoundRoute,
  ],
};
