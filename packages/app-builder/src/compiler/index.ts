import { ProjectEntry } from '../types/files';
import { compileBackend } from './backend';
import { AppConfig } from './schema';

export function compileApplication(appConfig: AppConfig): ProjectEntry[] {
  const projects: ProjectEntry[] = [];
  if (appConfig.apps.backend) {
    projects.push(compileBackend(appConfig));
  }
  return projects;
}
