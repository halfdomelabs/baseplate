import { AppConfig } from '../schema';
import { ProjectEntry } from '../types/files';
import { compileBackend } from './backend';

export function compileApplication(appConfig: AppConfig): ProjectEntry[] {
  const projects: ProjectEntry[] = appConfig.apps.map((app) => {
    if (app.type === 'backend') {
      return compileBackend(appConfig, app);
    }
    throw new Error(`Unknown app type: ${app.type as string}`);
  });
  return projects;
}
