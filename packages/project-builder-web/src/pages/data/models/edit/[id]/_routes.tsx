import type { RouteObject } from 'react-router-dom';

import { modelEntityType } from '@baseplate-dev/project-builder-lib';
import { Navigate } from 'react-router-dom';

import { NotFoundRoute } from '#src/pages/not-found.page.js';
import { createCrumbFromKey, createRouteCrumb } from '#src/types/routes.js';

import { ModelEditLayout } from './_layout.js';
import ModelEditGraphQLPage from './graphql.page.js';
import ModelEditModelPage from './index.page.js';
import ModelEditServicePage from './service.page.js';

export const ModelEditRoutes: RouteObject = {
  path: 'edit',
  children: [
    {
      index: true,
      element: <Navigate to="../" replace />,
    },
    {
      path: ':key',
      element: <ModelEditLayout />,
      handle: {
        crumb: createCrumbFromKey(
          modelEntityType,
          'Edit Model',
          '/data/models/edit/:key',
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
