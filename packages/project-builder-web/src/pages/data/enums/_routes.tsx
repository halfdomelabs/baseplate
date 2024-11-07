import { RouteObject } from 'react-router-dom';

import EnumsListPage from './EnumsList.page';
import { EnumEditRoutes } from './edit';
import { NotFoundRoute } from '@src/pages/NotFound.page';
import { createRouteCrumb } from '@src/types/routes';

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
