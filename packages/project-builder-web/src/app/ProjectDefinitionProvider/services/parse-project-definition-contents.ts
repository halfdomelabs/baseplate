import type { SchemaParserContext } from '@halfdomelabs/project-builder-lib';

import {
  createPluginImplementationStore,
  isMigrateableProjectDefinition,
  ProjectDefinitionContainer,
  runPluginMigrations,
  runSchemaMigrations,
  SchemaMigrationError,
} from '@halfdomelabs/project-builder-lib';
import { ZodError } from 'zod';

import { formatZodError, UserVisibleError } from '@src/utils/error';

export function parseProjectDefinitionContents(
  contents: string,
  schemaParserContext: SchemaParserContext,
): ProjectDefinitionContainer {
  try {
    const projectDefinition = JSON.parse(contents) as unknown;

    // migrate config
    if (!isMigrateableProjectDefinition(projectDefinition)) {
      throw new UserVisibleError(
        'The project configuration is not valid project definition with a schemaVersion property. Please check the file and try again.',
      );
    }
    const { migratedDefinition } = runSchemaMigrations(projectDefinition);

    const pluginImplementationStore = createPluginImplementationStore(
      schemaParserContext.pluginStore,
      migratedDefinition,
    );

    const definitionWithPluginMigrations = runPluginMigrations(
      migratedDefinition,
      pluginImplementationStore,
    );

    // validate config
    return ProjectDefinitionContainer.fromSerializedConfig(
      definitionWithPluginMigrations,
      schemaParserContext,
    );
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new UserVisibleError(
        'The project configuration is not a valid JSON file. Please check the file and try again.',
      );
    }
    if (err instanceof ZodError) {
      throw new UserVisibleError(
        `The project configuration is not valid: ${formatZodError(err)}`,
      );
    }
    if (err instanceof SchemaMigrationError) {
      throw new UserVisibleError(err.message);
    }
    throw err;
  }
}
