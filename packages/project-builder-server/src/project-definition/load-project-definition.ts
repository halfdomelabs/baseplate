import type {
  ProjectDefinition,
  SchemaParserContext,
} from '@baseplate-dev/project-builder-lib';

import {
  createPluginSpecStore,
  runPluginMigrations,
  runSchemaMigrations,
} from '@baseplate-dev/project-builder-lib';
import {
  enhanceErrorWithContext,
  hashWithSHA256,
  stringifyPrettyStable,
} from '@baseplate-dev/utils';
import { fileExists } from '@baseplate-dev/utils/node';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Loads the project definition from the given directory and runs migrations on it.
 * @param directory - The directory to load the project definition from.
 * @param context - The context to use for parsing the project.
 * @returns The project definition and the hash of the project definition.
 */
export async function loadProjectDefinition(
  directory: string,
  context: SchemaParserContext,
): Promise<{ definition: ProjectDefinition; hash: string }> {
  const projectJsonPath = path.join(
    directory,
    'baseplate/project-definition.json',
  );

  const projectJsonExists = await fileExists(projectJsonPath);

  if (!projectJsonExists) {
    throw new Error(`Could not find definition file at ${projectJsonPath}`);
  }

  try {
    const projectJsonContents = await readFile(projectJsonPath, 'utf8');
    const hash = await hashWithSHA256(projectJsonContents);

    const projectJson: unknown = JSON.parse(projectJsonContents);

    const { migratedDefinition, appliedMigrations } = runSchemaMigrations(
      projectJson as ProjectDefinition,
    );
    if (appliedMigrations.length > 0) {
      await writeFile(
        projectJsonPath,
        stringifyPrettyStable(migratedDefinition),
      );
    }

    const pluginSpecStore = createPluginSpecStore(
      context.pluginStore,
      migratedDefinition,
    );

    const definitionWithPluginMigrations = runPluginMigrations(
      migratedDefinition,
      pluginSpecStore,
    );

    return { definition: definitionWithPluginMigrations, hash };
  } catch (err) {
    throw enhanceErrorWithContext(
      err,
      `Error parsing project definition at ${projectJsonPath}`,
    );
  }
}
