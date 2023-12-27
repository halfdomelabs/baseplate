import { compileAdmin } from './admin/index.js';
import { compileBackend } from './backend/index.js';
import { compileWeb } from './web/index.js';
import {
  BaseAppConfig,
  ProjectConfig,
  projectConfigSchema,
} from '../schema/index.js';
import { AppEntry } from '../types/files.js';
import { deserializeSchemaWithReferences } from '@src/index.js';

export function compileApplications(
  rawProjectConfig: ProjectConfig,
): AppEntry[] {
  const { data: projectDefintiion } = deserializeSchemaWithReferences(
    projectConfigSchema,
    rawProjectConfig,
  );
  // Compile backend app first since it's likely the dependency for the other apps
  const appConfigs = [
    ...projectDefintiion.apps.filter((app) => app.type === 'backend'),
    ...projectDefintiion.apps.filter((app) => app.type !== 'backend'),
  ];
  const apps: AppEntry[] = appConfigs.map((app) => {
    switch (app.type) {
      case 'backend':
        return compileBackend(projectDefintiion, app);
      case 'web':
        return compileWeb(projectDefintiion, app);
      case 'admin':
        return compileAdmin(projectDefintiion, app);
      default:
        throw new Error(`Unknown app type: ${(app as BaseAppConfig).type}`);
    }
  });
  return apps;
}
