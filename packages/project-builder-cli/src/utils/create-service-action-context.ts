import type {
  ServiceActionContext,
  ServiceActionProject,
} from '@baseplate-dev/project-builder-server/actions';

import { getDefaultPlugins } from '@baseplate-dev/project-builder-common';

import { logger } from '#src/services/logger.js';
import { getUserConfig } from '#src/services/user-config.js';

import { listProjects } from './list-projects.js';

export async function createServiceActionContext(
  project?: ServiceActionProject,
): Promise<ServiceActionContext> {
  const projects = project ? [project] : await listProjects({});
  const plugins = await getDefaultPlugins(logger);
  const userConfig = await getUserConfig();

  return {
    projects,
    logger,
    userConfig,
    plugins,
  };
}
