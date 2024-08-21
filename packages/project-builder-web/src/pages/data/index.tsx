import { modelEnumEntityType } from '@halfdomelabs/project-builder-lib';
import { Navigate, RouteObject } from 'react-router-dom';

import { DataLayout } from './DataLayout';
import EnumsIndexPage from './enums/EnumsIndexPage';
import EnumEditPage from './enums/edit';
import { ModelRoutes } from './models';
import { NotFoundRoute } from '../NotFound.page';
import { createCrumbFromUid, createRouteCrumb } from '@src/types/routes';

export const DataRoutes: RouteObject = {
  element: <DataLayout />,
  path: '/data',
  children: [
    { index: true, element: <Navigate to="./models" /> },
    ModelRoutes,
    {
      path: 'enums/*',
      handle: {
        crumb: createRouteCrumb({ label: 'Enums', url: '/data/enums' }),
      },
      children: [
        { index: true, element: <EnumsIndexPage /> },
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
    },
  ],
};
