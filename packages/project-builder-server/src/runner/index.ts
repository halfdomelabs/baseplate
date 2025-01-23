import type {
  AppEntry,
  ProjectDefinition,
  SchemaParserContext,
} from '@halfdomelabs/project-builder-lib';
import type { Logger } from '@halfdomelabs/sync';

import {
  prettyStableStringify,
  runSchemaMigrations,
} from '@halfdomelabs/project-builder-lib';
import { fileExists, readJsonWithSchema } from '@halfdomelabs/utils/node';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

import { compileApplications } from '@src/compiler/index.js';

import { generateForDirectory } from '../sync/index.js';

async function loadProjectJson(directory: string): Promise<unknown> {
  const projectJsonPath = path.join(
    directory,
    'baseplate/project-definition.json',
  );

  const projectJsonExists = await fileExists(projectJsonPath);

  if (!projectJsonExists) {
    throw new Error(`Could not find definition file at ${projectJsonPath}`);
  }

  const projectJson: unknown = await readJsonWithSchema(
    projectJsonPath,
    z.object({}).passthrough(),
  );

  const { newConfig: migratedProjectJson, appliedMigrations } =
    runSchemaMigrations(projectJson as ProjectDefinition);
  if (appliedMigrations.length > 0) {
    await writeFile(
      projectJsonPath,
      prettyStableStringify(migratedProjectJson),
    );
  }

  return migratedProjectJson;
}

async function compileApplicationsFromDirectory({
  directory,
  context,
}: {
  directory: string;
  context: SchemaParserContext;
}): Promise<AppEntry[]> {
  const projectJson = await loadProjectJson(directory);

  return compileApplications(projectJson, context);
}

export interface BuildProjectForDirectoryOptions {
  directory: string;
  logger: Logger;
  context: SchemaParserContext;
}

export async function buildProjectForDirectory({
  directory,
  logger,
  context,
}: BuildProjectForDirectoryOptions): Promise<void> {
  const apps = await compileApplicationsFromDirectory({
    directory,
    context,
  });

  for (const app of apps) {
    await generateForDirectory({
      baseDirectory: directory,
      appEntry: app,
      logger,
    });
  }

  logger.info(`Project written to ${directory}!`);
}
