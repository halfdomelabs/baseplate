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
 * Result of diffing a single application.
 */
export interface AppDiffResult {
  /**
   * The name of the application.
   */
  name: string;
  /**
   * The directory of the application.
   */
  appDirectory: string;
  /**
   * The diff summary for this application.
   */
  diffSummary: Awaited<ReturnType<typeof compareFiles>>;
  /**
   * Whether differences were found.
   */
  hasDifferences: boolean;
}

/**
 * Result of diffing the entire project.
 */
export interface DiffProjectResult {
  /**
   * Results for each application.
   */
  appResults: AppDiffResult[];
  /**
   * Total number of files with differences.
   */
  totalDiffs: number;
  /**
   * Whether any differences were found across all applications.
   */
  hasDifferences: boolean;
}

/**
 * Generates a diff between what would be generated and what currently exists
 * in the working directory, returning structured data.
 *
 * This function is designed for programmatic use by other services that need
 * to process diff results rather than just display them to console.
 */
export async function diffProjectData(
  options: Omit<DiffProjectOptions, 'logger'>,
): Promise<DiffProjectResult> {
  const {
    directory,
    context,
    appFilter,
    globPatterns,
    useIgnoreFile = true,
  } = options;

  const { definition: projectJson } = await loadProjectDefinition(
    directory,
    context,
  );

  // Note: ignore patterns will be loaded per app directory

  const apps = compileApplications(projectJson, context);

  // Filter apps if specified
  const filteredApps = appFilter
    ? apps.filter((app) => appFilter.includes(app.name))
    : apps;

  if (filteredApps.length === 0) {
    return {
      appResults: [],
      totalDiffs: 0,
      hasDifferences: false,
    };
  }

  // Generate output for each app and collect diffs
  const appResults: AppDiffResult[] = [];
  let totalDiffs = 0;

  for (const app of filteredApps) {
    const appDirectory = path.join(directory, app.appDirectory);

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

    const hasDifferences = diffSummary.totalFiles > 0;
    if (hasDifferences) {
      totalDiffs += diffSummary.totalFiles;
    }

    appResults.push({
      name: app.name,
      appDirectory: app.appDirectory,
      diffSummary,
      hasDifferences,
    });
  }

  return {
    appResults,
    totalDiffs,
    hasDifferences: totalDiffs > 0,
  };
}

/**
 * Generates a diff between what would be generated and what currently exists
 * in the working directory, with console output.
 */
export async function diffProject(options: DiffProjectOptions): Promise<void> {
  const { logger, compact = false } = options;

  try {
    logger.info('Loading project definition...');

    const result = await diffProjectData(options);

    if (result.appResults.length === 0) {
      logger.warn('No applications found matching the filter criteria');
      return;
    }

    logger.info(
      `Generating output for ${result.appResults.length} application(s)...`,
    );

    // Process each app result and output to console
    for (const appResult of result.appResults) {
      logger.info(
        `Generating for app: ${appResult.name} (${appResult.appDirectory})`,
      );

      if (appResult.hasDifferences) {
        logger.info(`\n=== Diff for ${appResult.name} ===`);

        const output = compact
          ? formatCompactDiff(appResult.diffSummary)
          : formatUnifiedDiff(appResult.diffSummary);

        logger.info(output);
      } else {
        logger.info(`No differences found for ${appResult.name}`);
      }
    }

    if (result.hasDifferences) {
      logger.info(
        `Found differences in ${result.totalDiffs} file(s) across all applications`,
      );
    } else {
      logger.info('✓ No differences found across all applications');
    }
  } catch (error) {
    logger.error(`Error during diff generation: ${String(error)}`);
    throw error;
  }
}
