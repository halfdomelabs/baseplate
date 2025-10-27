import type { ProjectDefinition } from '@baseplate-dev/project-builder-lib';

/**
 * Get PostgreSQL database settings from project definition
 *
 * @param projectDefinition - The project definition containing infrastructure settings
 * @returns PostgreSQL configuration and connection URL
 */
export function getPostgresSettings(projectDefinition: ProjectDefinition): {
  config: {
    port: number;
    password: string;
    database: string;
  };
  url: string;
} {
  const port = projectDefinition.settings.general.portOffset + 432;
  const password = `${projectDefinition.settings.general.name}-password`;
  const database = projectDefinition.settings.general.name;

  return {
    config: { port, password, database },
    url: `postgres://postgres:${password}@localhost:${port}/${database}?schema=public`,
  };
}

/**
 * Get Redis settings from project definition
 *
 * @param projectDefinition - The project definition containing infrastructure settings
 * @returns Redis configuration and connection URL
 */
export function getRedisSettings(projectDefinition: ProjectDefinition): {
  config: {
    port: number;
    password: string;
  };
  url: string;
} {
  const port = projectDefinition.settings.general.portOffset + 379;
  const password = `${projectDefinition.settings.general.name}-password`;

  return {
    config: { port, password },
    url: `redis://:${password}@localhost:${port}`,
  };
}

/**
 * Check if Redis is enabled in the project infrastructure settings
 *
 * @param projectDefinition - The project definition containing infrastructure settings
 * @returns True if Redis is enabled
 */
export function isRedisEnabled(projectDefinition: ProjectDefinition): boolean {
  return projectDefinition.settings.infrastructure?.redis?.enabled ?? false;
}
