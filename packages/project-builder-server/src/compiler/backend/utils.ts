import { ProjectConfig } from '@halfdomelabs/project-builder-lib';

export function getPostgresSettings(projectConfig: ProjectConfig): {
  config: {
    port: number;
    password: string;
  };
  url: string;
} {
  const port = projectConfig.portOffset + 432;
  const password = `${projectConfig.name}-backend-password`;
  return {
    config: { port, password },
    url: `postgres://postgres:${password}@localhost:${port}/postgres?schema=public`,
  };
}

export function getRedisSettings(projectConfig: ProjectConfig): {
  config: {
    port: number;
    password: string;
  };
  url: string;
} {
  const port = projectConfig.portOffset + 379;
  const password = `${projectConfig.name}-backend-password`;
  return {
    config: { port, password },
    url: `redis://:${password}@localhost:${port}`,
  };
}
