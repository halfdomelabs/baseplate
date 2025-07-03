import type {
  ProjectDefinition,
  ProjectDefinitionInput,
} from '#src/schema/project-definition.js';

import { getLatestMigrationVersion } from '#src/migrations/index.js';
import { PluginImplementationStore } from '#src/plugins/index.js';
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
  const pluginStore = {
    availablePlugins: [],
  };
  const pluginImplementationStore = new PluginImplementationStore({});
  const resolvedRefPayload = deserializeSchemaWithTransformedReferences(
    createProjectDefinitionSchema,
    createTestProjectDefinitionInput(input),
    { plugins: pluginImplementationStore },
  );
  return new ProjectDefinitionContainer(
    resolvedRefPayload,
    { pluginStore },
    pluginImplementationStore,
  );
}
