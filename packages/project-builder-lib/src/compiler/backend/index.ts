import { ParsedProjectConfig } from '@src/parser';
import { ProjectConfig, BackendAppConfig } from '../../schema';
import { AppEntry } from '../../types/files';
import { AppEntryBuilder } from '../appEntryBuilder';
import { buildFastify } from './fastify';

export function buildDocker(projectConfig: ProjectConfig): unknown {
  return {
    name: 'docker',
    generator: '@baseplate/core/docker/docker-compose',
    postgres: {
      port: projectConfig.portBase + 432,
    },
  };
}

export function compileBackend(
  projectConfig: ProjectConfig,
  app: BackendAppConfig
): AppEntry {
  const appBuilder = new AppEntryBuilder(projectConfig, app);

  const parsedProject = new ParsedProjectConfig(projectConfig);

  appBuilder.addDescriptor('root.json', {
    generator: '@baseplate/core/node/node',
    name: `${projectConfig.name}-${app.name}`,
    description: `Backend app for ${projectConfig.name}`,
    version: projectConfig.version,
    hoistedProviders: parsedProject.globalHoistedProviders,
    children: {
      projects: [buildDocker(projectConfig), buildFastify(appBuilder, app)],
      jest: {
        generator: '@baseplate/core/node/jest',
      },
    },
  });
  return appBuilder.toProjectEntry();
}
