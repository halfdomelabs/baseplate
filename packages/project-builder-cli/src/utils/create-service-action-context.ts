import type { ProjectInfo } from '@baseplate-dev/project-builder-lib';
import type { ServiceActionContext } from '@baseplate-dev/project-builder-server/actions';

import { getDefaultPlugins } from '@baseplate-dev/project-builder-common';
import { getUserConfig } from '@baseplate-dev/project-builder-server/user-config';
import { getPackageVersion } from '@baseplate-dev/utils/node';

import { logger } from '#src/services/logger.js';

import { listProjects } from './list-projects.js';

export async function createServiceActionContext(
  project?: ProjectInfo,
): Promise<ServiceActionContext> {
  const projects = project ? [project] : await listProjects({});
  const plugins = await getDefaultPlugins(logger);
  const userConfig = await getUserConfig();
  const cliVersion = (await getPackageVersion(import.meta.dirname)) ?? '0.0.0';

  return {
    projects,
    logger,
    userConfig,
    plugins,
    cliVersion,
  };
}
