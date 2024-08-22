import { modelEnumEntityType } from '@halfdomelabs/project-builder-lib';
import { RouteObject } from 'react-router-dom';

import EnumsListPage from './EnumsList.page';
import EnumEditPage from './edit';
import { NotFoundRoute } from '@src/pages/NotFound.page';
import { createCrumbFromUid, createRouteCrumb } from '@src/types/routes';

export const EnumRoutes: RouteObject = {
  path: 'enums/*',
  handle: {
    crumb: createRouteCrumb({ label: 'Enums', url: '/data/enums' }),
  },
  children: [
    { index: true, element: <EnumsListPage /> },
    {
      path: 'new',
      element: <EnumEditPage />,
      handle: {
        crumb: 'New Enum',
      },
    },
    {
      path: 'edit/:uid/*',
      element: <EnumEditPage />,
      handle: {
        crumb: createCrumbFromUid(modelEnumEntityType, 'Edit Enum'),
      },
    },
    NotFoundRoute,
  ],
};
