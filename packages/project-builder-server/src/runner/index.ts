import type {
  ProjectDefinition,
  SchemaParserContext,
} from '@halfdomelabs/project-builder-lib';

import { runSchemaMigrations } from '@halfdomelabs/project-builder-lib';
import { type Logger } from '@halfdomelabs/sync';
import { stringifyPrettyStable } from '@halfdomelabs/utils';
import { fileExists, readJsonWithSchema } from '@halfdomelabs/utils/node';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

import type { BaseplateUserConfig } from '@src/user-config/user-config-schema.js';

import { compileApplications } from '@src/compiler/index.js';

import { generateForDirectory } from '../sync/index.js';

async function loadProjectJson(directory: string): Promise<ProjectDefinition> {
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

  const { migratedDefinition, appliedMigrations } = runSchemaMigrations(
    projectJson as ProjectDefinition,
  );
  if (appliedMigrations.length > 0) {
    await writeFile(projectJsonPath, stringifyPrettyStable(migratedDefinition));
  }

  return migratedDefinition;
}

export interface BuildProjectForDirectoryOptions {
  directory: string;
  logger: Logger;
  context: SchemaParserContext;
  userConfig: BaseplateUserConfig;
}

export async function buildProjectForDirectory({
  directory,
  logger,
  context,
  userConfig,
}: BuildProjectForDirectoryOptions): Promise<void> {
  const projectJson = await loadProjectJson(directory);

  const apps = compileApplications(projectJson, context);

  for (const app of apps) {
    await generateForDirectory({
      baseDirectory: directory,
      appEntry: app,
      logger,
      shouldWriteTemplateMetadata: projectJson.templateExtractor?.writeMetadata,
      userConfig,
    });
  }

  logger.info(`Project written to ${directory}!`);
}
