import type { RouteObject } from 'react-router-dom';

import { NotFoundRoute } from '#src/pages/NotFound.page.js';
import { createRouteCrumb } from '#src/types/routes.js';

import { EnumEditRoutes } from './edit/index.js';
import EnumsListPage from './EnumsList.page.js';

export const EnumRoutes: RouteObject = {
  path: 'enums/*',
  handle: {
    crumb: createRouteCrumb({ label: 'Enums', url: '/data/enums' }),
  },
  children: [
    { index: true, element: <EnumsListPage /> },
    EnumEditRoutes,
    NotFoundRoute,
  ],
};
