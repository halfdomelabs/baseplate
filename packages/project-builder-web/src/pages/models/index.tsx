import { modelEntityType } from '@halfdomelabs/project-builder-lib';
import { RouteObject } from 'react-router-dom';

import ModelListPage from './ModelList.page';
import { ModelsLayout } from './ModelsLayout';
import ModelEditPage from './edit';
import { EnumRoutes } from './enums';
import { createCrumbFromUid } from '@src/types/routes';

export const ModelRoutes: RouteObject[] = [
  {
    element: <ModelsLayout />,
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
        handle: { crumb: createCrumbFromUid(modelEntityType, 'Edit Model') },
      },
      { path: 'enums/*', children: EnumRoutes },
    ],
  },
];
