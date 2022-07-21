import { ProjectConfig } from '@src/schema';

export function getPostgresSettings(projectConfig: ProjectConfig): {
  config: {
    port: number;
    password: string;
  };
  url: string;
} {
  const port = projectConfig.portBase + 432;
  const password = `${projectConfig.name}-password`;
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
  const port = projectConfig.portBase + 379;
  const password = `${projectConfig.name}-password`;
  return {
    config: { port, password },
    url: `redis://:${password}@localhost:${port}`,
  };
}
