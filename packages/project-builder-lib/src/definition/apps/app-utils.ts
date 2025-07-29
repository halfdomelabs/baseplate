import type {
  AppConfig,
  BackendAppConfig,
  BaseAppConfig,
  ProjectDefinition,
} from '#src/schema/index.js';

import { computeRelativePath } from '#src/utils/path.js';

function byId(projectDefinition: ProjectDefinition, id: string): AppConfig {
  const config = projectDefinition.apps.find((app) => app.id === id);
  if (!config) {
    throw new Error(`Unable to find app with ID ${id}`);
  }
  return config;
}

function getBackendApp(projectDefinition: ProjectDefinition): BackendAppConfig {
  const backendApps = projectDefinition.apps.filter(
    (a): a is BackendAppConfig => a.type === 'backend',
  );

  if (backendApps.length > 1 || backendApps.length === 0) {
    throw new Error(`Only one backend app is supported and must exist`);
  }

  const backendApp = backendApps[0];

  return backendApp;
}

/**
 * Given an app config, get the relative directory of the app
 *
 * @param appConfig The app config
 * @returns The directory of the app
 */
function getAppDirectory(appConfig: BaseAppConfig): string {
  return appConfig.packageLocation
    ? appConfig.packageLocation
    : `packages/${appConfig.name}`;
}

export function getBackendRelativePath(
  appConfig: AppConfig,
  backendApp: BackendAppConfig,
): string {
  const backendRelativePath = computeRelativePath(
    getAppDirectory(appConfig),
    getAppDirectory(backendApp),
  );

  return backendRelativePath;
}

export const AppUtils = {
  byId,
  getBackendApp,
  getBackendRelativePath,
  getAppDirectory,
};
