import { modelEnumEntityType } from '@halfdomelabs/project-builder-lib';
import { RouteObject } from 'react-router-dom';

import { EnumEditLayout } from './EnumEditLayout';
import EnumEditPage from './edit.page';
import { NotFoundRoute } from '@src/pages/NotFound.page';
import { createCrumbFromUid } from '@src/types/routes';

export const EnumEditRoutes: RouteObject = {
  path: 'edit/:uid/*',
  element: <EnumEditLayout />,
  handle: {
    crumb: createCrumbFromUid(
      modelEnumEntityType,
      'Edit Enum',
      '/data/enums/edit/:uid',
    ),
  },
  children: [{ index: true, element: <EnumEditPage /> }, NotFoundRoute],
};
