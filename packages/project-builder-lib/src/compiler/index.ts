import { BaseAppConfig, ProjectConfig } from '../schema';
import { AppEntry } from '../types/files';
import { compileBackend } from './backend';
import { compileWeb } from './web';

export function compileApplications(projectConfig: ProjectConfig): AppEntry[] {
  const apps: AppEntry[] = projectConfig.apps.map((app) => {
    if (app.type === 'backend') {
      return compileBackend(projectConfig, app);
    }
    if (app.type === 'web') {
      return compileWeb(projectConfig, app);
    }
    throw new Error(`Unknown app type: ${(app as BaseAppConfig).type}`);
  });
  return apps;
}
