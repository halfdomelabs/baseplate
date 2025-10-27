import type { ProjectInfo } from '@baseplate-dev/project-builder-lib';
import type { ServiceActionContext } from '@baseplate-dev/project-builder-server/actions';

import { getDefaultPlugins } from '@baseplate-dev/project-builder-common';

import { logger } from '#src/services/logger.js';
import { getUserConfig } from '#src/services/user-config.js';

import { listProjects } from './list-projects.js';
import { getPackageVersion } from './version.js';

export async function createServiceActionContext(
  project?: ProjectInfo,
): Promise<ServiceActionContext> {
  const projects = project ? [project] : await listProjects({});
  const plugins = await getDefaultPlugins(logger);
  const userConfig = await getUserConfig();
  const cliVersion = await getPackageVersion();

  return {
    projects,
    logger,
    userConfig,
    plugins,
    cliVersion,
  };
}
