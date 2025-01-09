import type { RouteObject } from 'react-router-dom';

import { NotFoundRoute } from '@src/pages/NotFound.page';
import { createRouteCrumb } from '@src/types/routes';

import { ModelEditRoutes } from './edit/[id]/_routes';
import ModelsIndexPage from './index.page';

export const ModelsRoutes: RouteObject = {
  path: 'models/*',
  handle: {
    crumb: createRouteCrumb({ label: 'Models', url: '/data/models' }),
  },
  children: [
    { index: true, element: <ModelsIndexPage /> },
    ModelEditRoutes,
    NotFoundRoute,
  ],
};
