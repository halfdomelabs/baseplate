import type { PluginStore } from '#src/plugins/index.js';
import type {
  ProjectDefinition,
  ProjectDefinitionInput,
} from '#src/schema/project-definition.js';

import { getLatestMigrationVersion } from '#src/migrations/index.js';
import { createPluginSpecStore } from '#src/parser/parser.js';
import { deserializeSchemaWithTransformedReferences } from '#src/references/deserialize-schema.js';
import { createProjectDefinitionSchema } from '#src/schema/project-definition.js';

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
    packages: [],
    models: [],
    isInitialized: true,
    schemaVersion: getLatestMigrationVersion(),
    ...input,
  };
}

export function createTestProjectDefinitionInput(
  input: Partial<ProjectDefinitionInput> = {},
): ProjectDefinitionInput {
  return {
    ...createTestProjectDefinition(),
    ...input,
  };
}

export function createTestProjectDefinitionContainer(
  input: Partial<ProjectDefinitionInput> = {},
): ProjectDefinitionContainer {
  const pluginStore: PluginStore = {
    availablePlugins: [],
    coreModules: [],
  };
  const pluginImplementationStore = createPluginSpecStore(pluginStore, {
    plugins: [],
  });
  const resolvedRefPayload = deserializeSchemaWithTransformedReferences(
    createProjectDefinitionSchema,
    createTestProjectDefinitionInput(input),
    { plugins: pluginImplementationStore },
  );
  return new ProjectDefinitionContainer(
    resolvedRefPayload,
    {
      pluginStore,
      cliVersion: '0.1.0',
      project: {
        id: 'test-project',
        name: 'test-project',
        directory: '/test-project',
        isInternalExample: false,
      },
    },
    pluginImplementationStore,
  );
}
