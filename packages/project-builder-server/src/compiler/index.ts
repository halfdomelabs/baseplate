import {
  AppEntry,
  BaseAppConfig,
  ProjectDefinitionContainer,
  SchemaParserContext,
} from '@halfdomelabs/project-builder-lib';
import _ from 'lodash';

import { compileAdmin } from './admin/index.js';
import { compileBackend } from './backend/index.js';
import { compileWeb } from './web/index.js';

export * from './types.js';

export async function compileApplications(
  projectJson: unknown,
  context: SchemaParserContext,
): Promise<AppEntry[]> {
  const definitionContainer =
    await ProjectDefinitionContainer.fromSerializedConfig(projectJson, context);
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
