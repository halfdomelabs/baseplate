import type {
  ProjectDefinition,
  SchemaParserContext,
} from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';

import {
  createPluginImplementationStore,
  runPluginMigrations,
  runSchemaMigrations,
} from '@baseplate-dev/project-builder-lib';
import {
  buildGeneratorEntry,
  executeGeneratorEntry,
  formatGeneratorOutput,
  loadIgnorePatterns,
} from '@baseplate-dev/sync';
import { enhanceErrorWithContext, hashWithSHA256 } from '@baseplate-dev/utils';
import { fileExists } from '@baseplate-dev/utils/node';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { BaseplateUserConfig } from '#src/user-config/user-config-schema.js';

import { compileApplications } from '#src/compiler/index.js';

import { createTemplateMetadataOptions } from '../sync/template-metadata-utils.js';
import { compareFiles } from './diff-utils.js';
import { formatCompactDiff, formatUnifiedDiff } from './formatters.js';

/**
 * Load and parse project definition (extracted from build-project.ts)
 */
async function loadProjectJson(
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
      console.warn(
        `Note: ${appliedMigrations.length} migrations would be applied to project definition`,
      );
    }

    const pluginImplementationStore = createPluginImplementationStore(
      context.pluginStore,
      migratedDefinition,
    );

    const definitionWithPluginMigrations = runPluginMigrations(
      migratedDefinition,
      pluginImplementationStore,
    );

    return { definition: definitionWithPluginMigrations, hash };
  } catch (err) {
    throw enhanceErrorWithContext(
      err,
      `Error parsing project definition at ${projectJsonPath}`,
    );
  }
}

/**
 * Options for diffing the project.
 */
export interface DiffProjectOptions {
  /**
   * The directory to diff the project in.
   */
  directory: string;
  /**
   * The logger to use for logging.
   */
  logger: Logger;
  /**
   * The context to use for parsing the project.
   */
  context: SchemaParserContext;
  /**
   * The user config to use for building the project.
   */
  userConfig: BaseplateUserConfig;
  /**
   * Whether to show compact diff format.
   */
  compact?: boolean;
  /**
   * Filter by specific app names.
   */
  appFilter?: string[];
  /**
   * Filter files by glob patterns.
   */
  globPatterns?: string[];
  /**
   * Whether to use .baseplateignore file for filtering.
   */
  useIgnoreFile?: boolean;
}

/**
 * Generates a diff between what would be generated and what currently exists
 * in the working directory.
 */
export async function diffProject(options: DiffProjectOptions): Promise<void> {
  const {
    directory,
    logger,
    context,
    compact = false,
    appFilter,
    globPatterns,
    useIgnoreFile = true,
  } = options;

  try {
    logger.info('Loading project definition...');
    const { definition: projectJson } = await loadProjectJson(
      directory,
      context,
    );

    // Note: ignore patterns will be loaded per app directory

    logger.info('Compiling applications...');
    const apps = compileApplications(projectJson, context);

    // Filter apps if specified
    const filteredApps = appFilter
      ? apps.filter((app) => appFilter.includes(app.name))
      : apps;

    if (filteredApps.length === 0) {
      logger.warn('No applications found matching the filter criteria');
      return;
    }

    logger.info(
      `Generating output for ${filteredApps.length} application(s)...`,
    );

    // Generate output for each app and collect diffs
    let totalDiffs = 0;

    for (const app of filteredApps) {
      const appDirectory = path.join(directory, app.appDirectory);

      logger.info(`Generating for app: ${app.name} (${app.appDirectory})`);

      // Load ignore patterns for this app directory
      const ignorePatterns = useIgnoreFile
        ? await loadIgnorePatterns(appDirectory)
        : undefined;

      // Generate the output without writing files
      const generatorEntry = await buildGeneratorEntry(app.generatorBundle);
      const generatorOutput = await executeGeneratorEntry(generatorEntry, {
        templateMetadataOptions: createTemplateMetadataOptions(projectJson),
      });

      // Format the output
      const formattedGeneratorOutput = await formatGeneratorOutput(
        generatorOutput,
        { outputDirectory: appDirectory },
      );

      // Compare generated output with working directory
      const diffSummary = await compareFiles(
        appDirectory,
        formattedGeneratorOutput,
        globPatterns,
        ignorePatterns,
      );

      if (diffSummary.totalFiles > 0) {
        logger.info(`\n=== Diff for ${app.name} ===`);

        const output = compact
          ? formatCompactDiff(diffSummary)
          : formatUnifiedDiff(diffSummary);

        console.info(output);
        totalDiffs += diffSummary.totalFiles;
      } else {
        logger.info(`No differences found for ${app.name}`);
      }
    }

    if (totalDiffs === 0) {
      logger.info('✓ No differences found across all applications');
    } else {
      logger.info(
        `Found differences in ${totalDiffs} file(s) across all applications`,
      );
    }
  } catch (error) {
    logger.error(`Error during diff generation: ${String(error)}`);
    throw error;
  }
}
