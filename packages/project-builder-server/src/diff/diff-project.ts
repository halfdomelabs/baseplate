import type { SchemaParserContext } from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';

import {
  buildGeneratorEntry,
  executeGeneratorEntry,
  formatGeneratorOutput,
  loadIgnorePatterns,
} from '@baseplate-dev/sync';
import ignore from 'ignore';
import path from 'node:path';

import type { BaseplateUserConfig } from '#src/user-config/user-config-schema.js';

import { compileApplications } from '#src/compiler/index.js';
import { loadProjectDefinition } from '#src/project-definition/load-project-definition.js';

import { createTemplateMetadataOptions } from '../sync/template-metadata-utils.js';
import { compareFiles } from './diff-utils.js';
import { formatCompactDiff, formatUnifiedDiff } from './formatters.js';
import { applySnapshotToGeneratorOutput } from './snapshot/apply-diff-to-generator-output.js';
import { loadSnapshotManifest } from './snapshot/snapshot-manifest.js';
import { resolveSnapshotDirectory } from './snapshot/snapshot-utils.js';

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
    const { definition: projectJson } = await loadProjectDefinition(
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

      // Apply snapshot to generator output
      const snapshotDirectory = resolveSnapshotDirectory(appDirectory);
      const snapshot = await loadSnapshotManifest(snapshotDirectory);

      if (snapshot) {
        logger.info(`Applying snapshot to generator output for ${app.name}...`);
      }

      const diffedGeneratorOutput = snapshot
        ? await applySnapshotToGeneratorOutput(
            formattedGeneratorOutput,
            snapshot,
            snapshotDirectory.diffsPath,
          )
        : formattedGeneratorOutput;

      // Load ignore patterns for this app directory
      const ignorePatterns = useIgnoreFile
        ? await loadIgnorePatterns(appDirectory)
        : ignore();

      // Add added files to ignore pattern
      if (snapshot) {
        ignorePatterns.add(snapshot.files.added);
      }

      // Compare generated output with working directory
      const diffSummary = await compareFiles(
        appDirectory,
        diffedGeneratorOutput,
        globPatterns,
        ignorePatterns,
      );

      if (diffSummary.totalFiles > 0) {
        logger.info(`\n=== Diff for ${app.name} ===`);

        const output = compact
          ? formatCompactDiff(diffSummary)
          : formatUnifiedDiff(diffSummary);

        logger.info(output);
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
