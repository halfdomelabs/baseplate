import type { RouteObject } from 'react-router-dom';

import { modelEnumEntityType } from '@halfdomelabs/project-builder-lib';

import { NotFoundRoute } from '@src/pages/NotFound.page';
import { createCrumbFromUid } from '@src/types/routes';

import EnumEditPage from './edit.page';
import { EnumEditLayout } from './EnumEditLayout';

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
