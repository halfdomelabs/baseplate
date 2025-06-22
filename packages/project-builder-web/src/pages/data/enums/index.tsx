import type { RouteObject } from 'react-router-dom';

import { createRouteCrumb } from '#src/types/routes.js';

import { NotFoundRoute } from '../../not-found.page.js';
import { EnumEditRoutes } from './edit/index.js';
import EnumsListPage from './enums-list.page.js';

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
