import { Navigate, RouteObject } from 'react-router-dom';

import SettingsLayout from './_layout';
import { HierarchyPage } from './hierarchy';
import ProjectSettingsPage from './project-settings';
import { ThemeBuilderPage } from './theme-builder';
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
    {
      path: 'hierarchy',
      element: <HierarchyPage />,
      handle: { crumb: 'Hierarchy' },
    },
    {
      path: 'theme-builder',
      element: <ThemeBuilderPage />,
      handle: { crumb: 'Theme builder' },
    },
    { path: '*', element: <NotFoundPage /> },
  ],
};
