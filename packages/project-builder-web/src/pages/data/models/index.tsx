import type { RouteObject } from 'react-router-dom';

import { NotFoundRoute } from '@src/pages/NotFound.page';
import { createRouteCrumb } from '@src/types/routes';

import { ModelEditRoutes } from './edit/_routes';
import ModelListPage from './ModelList.page';

export const ModelRoutes: RouteObject = {
  path: 'models/*',
  handle: {
    crumb: createRouteCrumb({ label: 'Models', url: '/data/models' }),
  },
  children: [
    { index: true, element: <ModelListPage /> },
    ModelEditRoutes,
    NotFoundRoute,
  ],
};
