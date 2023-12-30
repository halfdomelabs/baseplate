import { AppConfig, ProjectConfig } from '@src/schema/index.js';

function byId(projectConfig: ProjectConfig, id: string): AppConfig {
  const config = projectConfig.apps.find((app) => app.id === id);
  if (!config) {
    throw new Error(`Unable to find app with ID ${id}`);
  }
  return config;
}

export const AppUtils = {
  byId,
};
