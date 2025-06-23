import type { RouteObject } from 'react-router-dom';

import { modelEnumEntityType } from '@baseplate-dev/project-builder-lib';

import { NotFoundRoute } from '#src/pages/not-found.page.js';
import { createCrumbFromKey } from '#src/types/routes.js';

import EnumEditPage from './edit.page.js';
import { EnumEditLayout } from './enum-edit-layout.js';

export const EnumEditRoutes: RouteObject = {
  path: 'edit/:key/*',
  element: <EnumEditLayout />,
  handle: {
    crumb: createCrumbFromKey(
      modelEnumEntityType,
      'Edit Enum',
      '/data/enums/edit/:key',
    ),
  },
  children: [{ index: true, element: <EnumEditPage /> }, NotFoundRoute],
};
