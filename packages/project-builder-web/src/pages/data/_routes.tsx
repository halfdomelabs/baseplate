import type { RouteObject } from 'react-router-dom';

import { Navigate } from 'react-router-dom';

import { DataLayout } from './_layout.js';
import { EnumRoutes } from './enums/index.js';
import { ModelsRoutes } from './models/_routes.js';

export const DataRoutes: RouteObject = {
  element: <DataLayout />,
  path: '/data',
  children: [
    { index: true, element: <Navigate to="./models" /> },
    ModelsRoutes,
    EnumRoutes,
  ],
};
