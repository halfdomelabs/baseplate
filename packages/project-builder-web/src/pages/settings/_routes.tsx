import { Navigate, RouteObject } from 'react-router-dom';

import ProjectSettingsPage from './ProjectSettings';
import SettingsLayout from './_layout';
import NotFoundPage from '../NotFound.page';

export const SettingsRoutes: RouteObject = {
  element: <SettingsLayout />,
  path: '/settings',
  handle: {
    crumb: 'Settings',
  },
  children: [
    { index: true, element: <Navigate to="./project-settings" /> },
    {
      path: 'project-settings',
      element: <ProjectSettingsPage />,
      handle: { crumb: 'Project settings' },
    },
    { path: '*', element: <NotFoundPage /> },
  ],
};
