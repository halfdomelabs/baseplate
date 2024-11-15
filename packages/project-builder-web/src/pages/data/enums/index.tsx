import type { RouteObject } from 'react-router-dom';

import { NotFoundRoute } from '@src/pages/NotFound.page';
import { createRouteCrumb } from '@src/types/routes';

import { EnumEditRoutes } from './edit';
import EnumsListPage from './EnumsList.page';

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
