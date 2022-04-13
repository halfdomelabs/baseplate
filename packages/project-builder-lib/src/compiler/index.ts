import { ProjectConfig } from '../schema';
import { AppEntry } from '../types/files';
import { compileBackend } from './backend';

export function compileApplications(projectConfig: ProjectConfig): AppEntry[] {
  const apps: AppEntry[] = projectConfig.apps.map((app) => {
    if (app.type === 'backend') {
      return compileBackend(projectConfig, app);
    }
    throw new Error(`Unknown app type: ${app.type as string}`);
  });
  return apps;
}
