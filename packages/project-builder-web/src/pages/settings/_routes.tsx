import type { RouteObject } from 'react-router-dom';

import { Navigate } from 'react-router-dom';

import NotFoundPage from '../not-found.page.js';
import SettingsLayout from './_layout.js';
import HierarchyPage from './hierarchy.js';
import ProjectSettingsPage from './project-settings.js';
import { TemplateExtractorSettingsPage } from './template-extractor.js';
import { ThemeBuilderPage } from './theme-builder.js';

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
