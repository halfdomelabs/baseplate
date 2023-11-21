import {
  AppConfig,
  ProjectConfig,
  BackendAppConfig,
} from '@src/schema/index.js';
import { computeRelativePath } from '@src/utils/path.js';

export function getBackendApp(projectConfig: ProjectConfig): BackendAppConfig {
  const backendApps = projectConfig.apps.filter(
    (a): a is BackendAppConfig => a.type === 'backend',
  );

  if (backendApps.length > 1 || !backendApps.length) {
    throw new Error(`Only one backend app is supported and must exist`);
  }

  const backendApp = backendApps[0];

  return backendApp;
}

export function getBackendRelativePath(
  appConfig: AppConfig,
  backendApp: BackendAppConfig,
): string {
  const backendRelativePath = computeRelativePath(
    appConfig.packageLocation
      ? appConfig.packageLocation
      : `packages/${appConfig.name}`,
    backendApp.packageLocation
      ? backendApp.packageLocation
      : `packages/${backendApp.name}`,
  );

  return backendRelativePath;
}
