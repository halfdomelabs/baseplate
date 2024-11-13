import { Navigate, RouteObject } from 'react-router-dom';

import { DataLayout } from './_layout';
import { EnumRoutes } from './enums';
import { ModelsRoutes } from './models/_routes';

export const DataRoutes: RouteObject = {
  element: <DataLayout />,
  path: '/data',
  children: [
    { index: true, element: <Navigate to="./models" /> },
    ModelsRoutes,
    EnumRoutes,
  ],
};
