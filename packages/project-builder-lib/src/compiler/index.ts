import { BaseAppConfig, ProjectConfig } from '../schema';
import { AppEntry } from '../types/files';
import { compileAdmin } from './admin';
import { compileBackend } from './backend';
import { compileWeb } from './web';

export function compileApplications(projectConfig: ProjectConfig): AppEntry[] {
  // Compile backend app first since it's likely the dependency for the other apps
  const appConfigs = [
    ...projectConfig.apps.filter((app) => app.type === 'backend'),
    ...projectConfig.apps.filter((app) => app.type !== 'backend'),
  ];
  const apps: AppEntry[] = appConfigs.map((app) => {
    switch (app.type) {
      case 'backend':
        return compileBackend(projectConfig, app);
      case 'web':
        return compileWeb(projectConfig, app);
      case 'admin':
        return compileAdmin(projectConfig, app);
      default:
        throw new Error(`Unknown app type: ${(app as BaseAppConfig).type}`);
    }
  });
  return apps;
}
