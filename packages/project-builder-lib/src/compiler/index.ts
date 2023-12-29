import _ from 'lodash';

import { compileAdmin } from './admin/index.js';
import { compileBackend } from './backend/index.js';
import { compileWeb } from './web/index.js';
import { BaseAppConfig, ProjectConfig } from '../schema/index.js';
import { AppEntry } from '../types/files.js';
import { ProjectDefinitionContainer } from '@src/index.js';

export function compileApplications(
  rawProjectConfig: ProjectConfig,
): AppEntry[] {
  const definitionContainer =
    ProjectDefinitionContainer.fromSerializedConfig(rawProjectConfig);
  // Compile backend app first since it's likely the dependency for the other apps
  const appConfigs = _.sortBy(definitionContainer.definition.apps, [
    (a) => (a.type === 'backend' ? 0 : 1),
    (a) => a.name,
  ]);
  const apps: AppEntry[] = appConfigs.map((app) => {
    switch (app.type) {
      case 'backend':
        return compileBackend(definitionContainer, app);
      case 'web':
        return compileWeb(definitionContainer, app);
      case 'admin':
        return compileAdmin(definitionContainer, app);
      default:
        throw new Error(`Unknown app type: ${(app as BaseAppConfig).type}`);
    }
  });
  return apps;
}
