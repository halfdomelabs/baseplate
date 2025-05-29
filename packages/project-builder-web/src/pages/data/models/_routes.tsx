import type { RouteObject } from 'react-router-dom';

import { NotFoundRoute } from '#src/pages/NotFound.page.js';
import { createRouteCrumb } from '#src/types/routes.js';

import { ModelEditRoutes } from './edit/[id]/_routes.js';
import ModelsIndexPage from './index.page.js';

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
