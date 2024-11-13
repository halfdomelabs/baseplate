import { RouteObject } from 'react-router-dom';

import { ModelEditRoutes } from './edit';
import ModelsIndexPage from './index.page';
import { NotFoundRoute } from '@src/pages/NotFound.page';
import { createRouteCrumb } from '@src/types/routes';

export const ModelRoutes: RouteObject = {
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
