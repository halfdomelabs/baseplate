import {
  buildGeneratorEntry,
  executeGeneratorEntry,
  formatGeneratorOutput,
  loadIgnorePatterns,
} from '@baseplate-dev/sync';
import { enhanceErrorWithContext } from '@baseplate-dev/utils';
import path from 'node:path';

import type { ServiceActionContext } from '#src/actions/types.js';

import { compilePackages } from '#src/compiler/index.js';
import { createNodeSchemaParserContext } from '#src/plugins/node-plugin-store.js';
import { loadProjectDefinition } from '#src/project-definition/load-project-definition.js';

import type { DiffSummary } from './types.js';

import { createTemplateMetadataOptions } from '../sync/template-metadata-utils.js';
import { compareFiles } from './diff-utils.js';
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
  projectDirectory: string;
  /**
   * Filter by specific package names.
   */
  packageFilter?: string[];
  /**
   * Filter files by glob patterns.
   */
  include?: string[];
}

/**
 * Result of diffing a single package.
 */
export interface PackageDiffResult {
  /**
   * The name of the package.
   */
  name: string;
  /**
   * The directory of the package.
   */
  packageDirectory: string;
  /**
   * The diff summary for this package.
   */
  diffSummary: DiffSummary;
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
   * Results for each package.
   */
  packageResults: PackageDiffResult[];
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
 */
export async function diffProject(
  options: DiffProjectOptions,
  context: ServiceActionContext,
): Promise<DiffProjectResult> {
  const { projectDirectory, packageFilter, include } = options;
  const { logger, plugins } = context;

  const parserContext = await createNodeSchemaParserContext(
    projectDirectory,
    logger,
    plugins,
  );

  const { definition: projectJson } = await loadProjectDefinition(
    projectDirectory,
    parserContext,
  );

  const apps = compilePackages(projectJson, parserContext);

  // Filter apps if specified
  const filteredApps = packageFilter?.length
    ? apps.filter((app) => packageFilter.includes(app.name))
    : apps;

  if (filteredApps.length === 0) {
    return {
      packageResults: [],
      totalDiffs: 0,
      hasDifferences: false,
    };
  }

  logger.info(
    `Building packages for ${filteredApps.map((app) => app.name).join(', ')}...`,
  );

  // Generate output for each app and collect diffs
  const appResults: PackageDiffResult[] = [];
  let totalDiffs = 0;

  for (const app of filteredApps) {
    try {
      const appDirectory = path.join(projectDirectory, app.packageDirectory);

      logger.info(`Building package: ${app.name} (${app.packageDirectory})...`);

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
      const ignorePatterns = await loadIgnorePatterns(appDirectory);

      // Add added files to ignore pattern
      if (snapshot) {
        ignorePatterns.add(snapshot.files.added);
      }

      // Compare generated output with working directory
      const diffSummary = await compareFiles(
        appDirectory,
        diffedGeneratorOutput,
        include,
        ignorePatterns,
      );

      const hasDifferences = diffSummary.totalFiles > 0;
      if (hasDifferences) {
        totalDiffs += diffSummary.totalFiles;
      }

      appResults.push({
        name: app.name,
        packageDirectory: app.packageDirectory,
        diffSummary,
        hasDifferences,
      });
    } catch (err) {
      throw enhanceErrorWithContext(err, `Error building package: ${app.name}`);
    }
  }

  return {
    packageResults: appResults,
    totalDiffs,
    hasDifferences: totalDiffs > 0,
  };
}

// /**
//  * Generates a diff between what would be generated and what currently exists
//  * in the working directory, with console output.
//  */
// export async function diffProject(options: DiffProjectOptions): Promise<void> {
//   const { logger, compact = false } = options;

//   try {
//     logger.info('Loading project definition...');

//     const result = await diffProjectData(options);

//     if (result.appResults.length === 0) {
//       logger.warn('No applications found matching the filter criteria');
//       return;
//     }

//     logger.info(
//       `Generating output for ${result.appResults.length} application(s)...`,
//     );

//     // Process each app result and output to console
//     for (const appResult of result.appResults) {
//       logger.info(
//         `Generating for app: ${appResult.name} (${appResult.appDirectory})`,
//       );

//       if (appResult.hasDifferences) {
//         logger.info(`\n=== Diff for ${appResult.name} ===`);

//         const output = compact
//           ? formatCompactDiff(appResult.diffSummary)
//           : formatUnifiedDiff(appResult.diffSummary);

//         logger.info(output);
//       } else {
//         logger.info(`No differences found for ${appResult.name}`);
//       }
//     }

//     if (result.hasDifferences) {
//       logger.info(
//         `Found differences in ${result.totalDiffs} file(s) across all applications`,
//       );
//     } else {
//       logger.info('✓ No differences found across all applications');
//     }
//   } catch (error) {
//     logger.error(`Error during diff generation: ${String(error)}`);
//     throw error;
//   }
// }
