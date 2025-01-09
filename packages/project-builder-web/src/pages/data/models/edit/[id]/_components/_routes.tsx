import type { RouteObject } from 'react-router-dom';

import { modelEntityType } from '@halfdomelabs/project-builder-lib';
import { Navigate } from 'react-router-dom';

import { NotFoundRoute } from '@src/pages/NotFound.page';
import { createCrumbFromUid, createRouteCrumb } from '@src/types/routes';

import { ModelEditLayout } from '../../_layout';
import ModelEditGraphQLPage from './graphql.page';
import ModelEditModelPage from './index.page';
import ModelEditServicePage from './service.page';

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
          element: <ModelEditGraphQLPage />,
          handle: {
            crumb: createRouteCrumb('GraphQL'),
          },
        },
        NotFoundRoute,
      ],
    },
  ],
};
