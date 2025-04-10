import type { RouteObject } from 'react-router-dom';

import { Navigate } from 'react-router-dom';

import NotFoundPage from '../NotFound.page';
import SettingsLayout from './_layout';
import HierarchyPage from './hierarchy';
import ProjectSettingsPage from './project-settings';
import { TemplateExtractorSettingsPage } from './template-extractor';
import { ThemeBuilderPage } from './theme-builder';

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
    {
      path: 'template-extractor',
      element: <TemplateExtractorSettingsPage />,
      handle: { crumb: 'Template extractor' },
    },
    { path: '*', element: <NotFoundPage /> },
  ],
};
