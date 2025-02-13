import type { SchemaParserContext } from '@halfdomelabs/project-builder-lib';

import {
  isMigrateableProjectDefinition,
  ProjectDefinitionContainer,
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
        'The project configuration is not valid JSON object. Please check the file and try again.',
      );
    }
    const { migratedDefinition } = runSchemaMigrations(projectDefinition);

    // validate config
    return ProjectDefinitionContainer.fromSerializedConfig(
      migratedDefinition,
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
