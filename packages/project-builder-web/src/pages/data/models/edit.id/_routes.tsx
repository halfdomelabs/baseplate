import { modelEntityType } from '@halfdomelabs/project-builder-lib';
import { Navigate, RouteObject } from 'react-router-dom';

import { ModelEditLayout } from './_layout';
import ModelEditModelPage from './index.page';
import ModelEditSchemaPage from './schema/schema.page';
import ModelEditServicePage from './service/service.page';
import { NotFoundRoute } from '@src/pages/NotFound.page';
import { createCrumbFromUid, createRouteCrumb } from '@src/types/routes';

export const ModelEditRoutes: RouteObject = {
  path: 'edit',
  children: [
    {
      index: true,
      element: <Navigate to="../" replace />,
    },
    {
      path: ':uid',
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
    },
  ],
};
