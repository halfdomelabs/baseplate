import type { RouteObject } from 'react-router-dom';

import { Navigate } from 'react-router-dom';

import { DataLayout } from './DataLayout';
import { EnumRoutes } from './enums';
import { ModelRoutes } from './models';

export const DataRoutes: RouteObject = {
  element: <DataLayout />,
  path: '/data',
  children: [
    { index: true, element: <Navigate to="./models" /> },
    ModelRoutes,
    EnumRoutes,
  ],
};
