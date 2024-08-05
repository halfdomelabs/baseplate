import {
  modelEntityType,
  modelEnumEntityType,
} from '@halfdomelabs/project-builder-lib';
import { Navigate, RouteObject } from 'react-router-dom';

import { SchemaLayout } from './SchemaLayout';
import EnumsIndexPage from './enums/EnumsIndexPage';
import EnumEditPage from './enums/edit';
import ModelListPage from './models/ModelList.page';
import ModelEditPage from './models/edit';
import { createCrumbFromUid } from '@src/types/routes';

export const SchemaRoutes: RouteObject = {
  element: <SchemaLayout />,
  path: '/schema',
  children: [
    { index: true, element: <Navigate to="/schema/models" /> },
    {
      path: 'models/*',
      children: [
        { index: true, element: <ModelListPage /> },
        {
          path: 'new',
          element: <ModelEditPage />,
          handle: {
            crumb: 'New Model',
          },
        },
        {
          path: 'edit/:uid/*',
          element: <ModelEditPage />,
          handle: {
            crumb: createCrumbFromUid(modelEntityType, 'Edit Model'),
          },
        },
      ],
    },
    {
      path: 'enums/*',
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
      ],
    },
  ],
};
