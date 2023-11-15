import { buildFastify } from './fastify.js';
import { getPostgresSettings, getRedisSettings } from './utils.js';
import { ProjectConfig, BackendAppConfig } from '../../schema/index.js';
import { AppEntry } from '../../types/files.js';
import { AppEntryBuilder } from '../appEntryBuilder.js';
import { ParsedProjectConfig } from '@src/parser/index.js';

export function buildDocker(
  projectConfig: ProjectConfig,
  app: BackendAppConfig,
): unknown {
  return {
    name: 'docker',
    generator: '@halfdomelabs/core/docker/docker-compose',
    postgres: getPostgresSettings(projectConfig).config,
    ...(app.enableRedis
      ? { redis: getRedisSettings(projectConfig).config }
      : {}),
  };
}

export function compileBackend(
  projectConfig: ProjectConfig,
  app: BackendAppConfig,
): AppEntry {
  const appBuilder = new AppEntryBuilder(projectConfig, app);

  const parsedProject = new ParsedProjectConfig(projectConfig);

  const packageName = projectConfig.packageScope
    ? `@${projectConfig.packageScope}/${app.name}`
    : `${projectConfig.name}-${app.name}`;

  appBuilder.addDescriptor('root.json', {
    generator: '@halfdomelabs/core/node/node',
    name: `${projectConfig.name}-${app.name}`,
    packageName,
    description: `Backend app for ${projectConfig.name}`,
    version: projectConfig.version,
    hoistedProviders: parsedProject.globalHoistedProviders,
    children: {
      projects: [
        buildDocker(projectConfig, app),
        buildFastify(appBuilder, app),
      ],
      jest: {
        generator: '@halfdomelabs/core/node/jest',
      },
    },
  });
  return appBuilder.toProjectEntry();
}
