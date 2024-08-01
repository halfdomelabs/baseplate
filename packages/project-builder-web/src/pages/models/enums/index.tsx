import { modelEnumEntityType } from '@halfdomelabs/project-builder-lib';
import { RouteObject } from 'react-router-dom';

import EnumsIndexPage from './EnumsIndexPage';
import EnumEditPage from './edit';
import { createCrumbFromUid } from '@src/types/routes';

export const EnumRoutes: RouteObject[] = [
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
    handle: { crumb: createCrumbFromUid(modelEnumEntityType, 'Edit Enum') },
  },
];
