import type {
  AppEntry,
  BaseAppConfig,
  SchemaParserContext,
} from '@halfdomelabs/project-builder-lib';

import { ProjectDefinitionContainer } from '@halfdomelabs/project-builder-lib';
import { sortBy } from 'es-toolkit';

import { compileAdmin } from './admin/index.js';
import { compileBackend } from './backend/index.js';
import { compileWeb } from './web/index.js';

export type * from './types.js';

export function compileApplications(
  projectJson: unknown,
  context: SchemaParserContext,
): AppEntry[] {
  const definitionContainer = ProjectDefinitionContainer.fromSerializedConfig(
    projectJson,
    context,
  );
  // Compile backend app first since it's likely the dependency for the other apps
  const appConfigs = sortBy(definitionContainer.definition.apps, [
    (a) => (a.type === 'backend' ? 0 : 1),
    (a) => a.name,
  ]);
  const apps: AppEntry[] = appConfigs.map((app) => {
    switch (app.type) {
      case 'backend': {
        return compileBackend(definitionContainer, app);
      }
      case 'web': {
        return compileWeb(definitionContainer, app);
      }
      case 'admin': {
        return compileAdmin(definitionContainer, app);
      }
      default: {
        throw new Error(`Unknown app type: ${(app as BaseAppConfig).type}`);
      }
    }
  });
  return apps;
}
