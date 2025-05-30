import { getLatestMigrationVersion } from '#src/migrations/index.js';
import {
  PluginImplementationStore,
  zPluginWrapper,
} from '#src/plugins/index.js';
import { deserializeSchemaWithReferences } from '#src/references/deserialize-schema.js';
import {
  createProjectDefinitionSchema,
  type ProjectDefinition,
} from '#src/schema/project-definition.js';

import { ProjectDefinitionContainer } from './project-definition-container.js';

export function createTestProjectDefinition(
  input: Partial<ProjectDefinition> = {},
): ProjectDefinition {
  return {
    settings: {
      general: {
        name: 'test-project',
        packageScope: '',
        portOffset: 3000,
      },
    },
    features: [],
    cliVersion: '1.0.0',
    apps: [],
    models: [],
    isInitialized: true,
    schemaVersion: getLatestMigrationVersion(),
    ...input,
  };
}

export function createTestProjectDefinitionContainer(
  input: Partial<ProjectDefinition> = {},
): ProjectDefinitionContainer {
  const pluginStore = {
    availablePlugins: [],
  };
  const pluginImplementationStore = new PluginImplementationStore({});
  const projectDefinitionSchema = createProjectDefinitionSchema({
    plugins: pluginImplementationStore,
  });
  const schemaWithPlugins = zPluginWrapper(
    projectDefinitionSchema,
    pluginImplementationStore,
  );
  const resolvedRefPayload = deserializeSchemaWithReferences(
    schemaWithPlugins,
    createTestProjectDefinition(input),
  );
  return new ProjectDefinitionContainer(
    resolvedRefPayload,
    { pluginStore },
    pluginImplementationStore,
  );
}
