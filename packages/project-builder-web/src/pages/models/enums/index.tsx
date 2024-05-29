import { modelEnumEntityType } from '@halfdomelabs/project-builder-lib';
import { RouteObject } from 'react-router-dom';

import EnumEditPage from './edit';
import { createCrumbFromUid } from '@src/types/routes';

export const EnumRoutes: RouteObject[] = [
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
    handle: { crumb: createCrumbFromUid(modelEnumEntityType, 'Edit Enum') },
  },
];
