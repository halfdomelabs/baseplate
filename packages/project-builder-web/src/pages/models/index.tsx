import {
  modelEntityType,
  modelEnumEntityType,
} from '@halfdomelabs/project-builder-lib';
import { RouteObject } from 'react-router-dom';

import ModelListPage from './ModelList.page';
import { ModelsEnumsLayout } from './ModelsEnumsLayout';
import ModelEditPage from './edit';
import EnumsIndexPage from './enums/EnumsIndexPage';
import EnumEditPage from './enums/edit';
import { createCrumbFromUid } from '@src/types/routes';

export const ModelsEnumsRoutes: RouteObject = {
  element: <ModelsEnumsLayout />,
  children: [
    {
      path: '/models/*',
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
