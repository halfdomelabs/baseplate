import { AppConfig } from '../schema';
import { ProjectEntry } from '../types/files';
import { compileBackend } from './backend';

export function compileApplication(appConfig: AppConfig): ProjectEntry[] {
  const projects: ProjectEntry[] = [];
  if (appConfig.apps.backend) {
    projects.push(compileBackend(appConfig));
  }
  return projects;
}
