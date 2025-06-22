import type { RouteObject } from 'react-router-dom';

import { modelEnumEntityType } from '@baseplate-dev/project-builder-lib';

import { NotFoundRoute } from '#src/pages/not-found.page.js';
import { createCrumbFromUid } from '#src/types/routes.js';

import EnumEditPage from './edit.page.js';
import { EnumEditLayout } from './enum-edit-layout.js';

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
