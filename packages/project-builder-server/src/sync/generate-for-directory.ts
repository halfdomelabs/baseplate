import type { AppEntry } from '@baseplate-dev/project-builder-lib';
import type {
  FileWithConflict,
  Logger,
  TemplateMetadataOptions,
} from '@baseplate-dev/sync';

import { CancelledSyncError } from '@baseplate-dev/sync';
import { randomKey } from '@baseplate-dev/utils';
import chalk from 'chalk';
import { mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';

import type { BaseplateUserConfig } from '#src/user-config/user-config-schema.js';

import type { PackageSyncResult } from './sync-metadata.js';
import type { GeneratorOperations } from './types.js';

import { applySnapshotToGeneratorOutput } from '../diff/snapshot/apply-diff-to-generator-output.js';
import { loadSnapshotManifest } from '../diff/snapshot/snapshot-manifest.js';
import { resolveSnapshotDirectory } from '../diff/snapshot/snapshot-utils.js';
import { writeGeneratedFileIdMap } from './file-id-map.js';
import { DEFAULT_GENERATOR_OPERATIONS } from './types.js';

interface GenerateForDirectoryOptions {
  baseDirectory: string;
  appEntry: AppEntry;
  logger: Logger;
  writeTemplateMetadataOptions?: TemplateMetadataOptions;
  userConfig: BaseplateUserConfig;
  previousPackageSyncResult: PackageSyncResult | undefined;
  operations?: GeneratorOperations;
  abortSignal?: AbortSignal;
  skipCommands?: boolean;
  overwrite?: boolean;
  snapshotDirectory?: string;
}

const GENERATED_DIRECTORY = 'baseplate/generated';

export async function generateForDirectory({
  baseDirectory,
  appEntry,
  logger,
  writeTemplateMetadataOptions,
  userConfig,
  previousPackageSyncResult,
  operations = DEFAULT_GENERATOR_OPERATIONS,
  abortSignal,
  skipCommands,
  overwrite,
  snapshotDirectory,
}: GenerateForDirectoryOptions): Promise<PackageSyncResult> {
  const { appDirectory, name, generatorBundle } = appEntry;

  const projectDirectory = path.join(baseDirectory, appDirectory);

  logger.info(`Generating project ${name} in ${projectDirectory}...`);

  const project = await operations.buildGeneratorEntry(generatorBundle);
  let output = await operations.executeGeneratorEntry(project, {
    templateMetadataOptions: writeTemplateMetadataOptions,
  });

  if (abortSignal?.aborted) throw new CancelledSyncError();

  // Apply snapshot if overwrite is enabled and snapshots exist
  if (overwrite) {
    const resolvedSnapshotDirectory = snapshotDirectory
      ? resolveSnapshotDirectory(projectDirectory, {
          snapshotDir: snapshotDirectory,
        })
      : resolveSnapshotDirectory(projectDirectory);

    const snapshot = await loadSnapshotManifest(resolvedSnapshotDirectory);

    if (snapshot) {
      logger.info(`Applying snapshot to generator output for ${name}...`);
      try {
        output = await applySnapshotToGeneratorOutput(
          output,
          snapshot,
          resolvedSnapshotDirectory.diffsPath,
        );
      } catch (error) {
        logger.error(
          `Failed to apply snapshot to generator output for ${name}: ${error instanceof Error ? error.message : String(error)}`,
        );
        logger.error(
          'Please run `baseplate snapshot fix-diffs` to resolve conflicts and try again.',
        );
        throw error;
      }
    }
  }

  logger.info('Project built! Writing output....');

  // load clean directory contents
  const previousGeneratedPayload =
    await operations.getPreviousGeneratedPayload(projectDirectory);

  if (previousGeneratedPayload) {
    logger.debug('Detected generated folder. Attempting 3-way merge...');
  }

  const generatedTemporaryDirectory = path.join(
    projectDirectory,
    'baseplate/build/generated_tmp',
  );

  await mkdir(generatedTemporaryDirectory, { recursive: true });

  try {
    const { failedCommands, filesWithConflicts, fileIdToRelativePathMap } =
      await operations.writeGeneratorOutput(output, projectDirectory, {
        previousGeneratedPayload,
        generatedContentsDirectory: generatedTemporaryDirectory,
        rerunCommands: previousPackageSyncResult?.failedCommands?.map(
          (c) => c.command,
        ),
        logger,
        mergeDriver: userConfig.sync?.customMergeDriver
          ? {
              name: 'baseplate-custom-merge-driver',
              driver: userConfig.sync.customMergeDriver,
            }
          : undefined,
        abortSignal,
        skipCommands,
        forceOverwrite: overwrite,
      });

    // write metadata to the generated directory
    if (writeTemplateMetadataOptions?.includeTemplateMetadata) {
      await operations.writeMetadata(project, output, projectDirectory);
    }

    // swap out generated directory with generated_tmp
    const generatedDirectory = path.join(projectDirectory, GENERATED_DIRECTORY);
    if (previousGeneratedPayload) {
      await rm(generatedDirectory, { recursive: true });
    }
    await rename(generatedTemporaryDirectory, generatedDirectory);

    // Write file ID map
    await writeGeneratedFileIdMap(projectDirectory, fileIdToRelativePathMap);

    // Write generator steps
    if (userConfig.sync?.writeGeneratorStepsJson && output.metadata) {
      await operations.writeGeneratorSteps(output.metadata, projectDirectory);
    }

    // List out conflicts
    function warnAboutConflicts(
      conflicts: FileWithConflict[],
      message: string,
    ): void {
      if (conflicts.length === 0) {
        return;
      }

      logger.warn(
        chalk.red(
          `${message}\n${conflicts.map((f) => f.relativePath).join('\n')}`,
        ),
      );
    }
    warnAboutConflicts(
      filesWithConflicts.filter((f) => f.conflictType === 'merge-conflict'),
      'Merge conflicts occurred while writing files:',
    );
    warnAboutConflicts(
      filesWithConflicts.filter((f) => f.conflictType === 'generated-deleted'),
      'Files were deleted in the new generation but were modified by user so could not be automatically deleted:',
    );
    warnAboutConflicts(
      filesWithConflicts.filter((f) => f.conflictType === 'working-deleted'),
      'Files were deleted by user but were added back in the new generation so should be reviewed:',
    );

    if (failedCommands.length > 0) {
      logger.error(
        `Project successfully written but with failed commands! Please check logs for more info.`,
      );
    } else {
      logger.info('Project successfully generated!');
    }

    return {
      filesWithConflicts,
      failedCommands: failedCommands.map((c) => ({
        id: randomKey(),
        command: c.command,
        workingDir: c.workingDir,
        output: c.output,
      })),
      completedAt: new Date().toISOString(),
    };
  } finally {
    // attempt to remove any temporary directory
    await rm(generatedTemporaryDirectory, { recursive: true }).catch(() => {
      /* ignore errors */
    });
  }
}
