import type { ProjectDefinition } from '@halfdomelabs/project-builder-lib';

export function getPostgresSettings(projectDefinition: ProjectDefinition): {
  config: {
    port: number;
    password: string;
  };
  url: string;
} {
  const port = projectDefinition.portOffset + 432;
  const password = `${projectDefinition.name}-backend-password`;
  return {
    config: { port, password },
    url: `postgres://postgres:${password}@localhost:${port}/postgres?schema=public`,
  };
}

export function getRedisSettings(projectDefinition: ProjectDefinition): {
  config: {
    port: number;
    password: string;
  };
  url: string;
} {
  const port = projectDefinition.portOffset + 379;
  const password = `${projectDefinition.name}-backend-password`;
  return {
    config: { port, password },
    url: `redis://:${password}@localhost:${port}`,
  };
}
