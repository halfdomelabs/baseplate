import type { ProjectDefinition } from '@baseplate-dev/project-builder-lib';

import { createRootRouteWithContext } from '@tanstack/react-router';

import { AppLayout } from '#src/app/app-layout/app-layout.js';

interface RouterContext {
  getTitle?: () => string;
  projectDefinition: ProjectDefinition;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: AppLayout,
});
