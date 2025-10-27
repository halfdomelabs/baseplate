import type {
  FileWithConflict,
  Logger,
  OverwriteOptions,
  TemplateMetadataOptions,
} from '@baseplate-dev/sync';

import { CancelledSyncError, loadIgnorePatterns } from '@baseplate-dev/sync';
import { randomKey } from '@baseplate-dev/utils';
import chalk from 'chalk';
import { mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';

import type { PackageEntry } from '#src/compiler/package-entry.js';
import type { BaseplateUserConfig } from '#src/user-config/user-config-schema.js';

import { applySnapshotToFileContents } from '#src/diff/index.js';

import type { PackageSyncResult } from './sync-metadata.js';
import type { GeneratorOperations } from './types.js';

import { loadSnapshotManifest } from '../diff/snapshot/snapshot-manifest.js';
import { resolveSnapshotDirectory } from '../diff/snapshot/snapshot-utils.js';
import { writeGeneratedFileIdMap } from './file-id-map.js';
import { GENERATED_DIRECTORY } from './get-previous-generated-payload.js';
import { DEFAULT_GENERATOR_OPERATIONS } from './types.js';

interface GenerateForDirectoryOptions {
  baseDirectory: string;
  appEntry: PackageEntry;
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
  const { packageDirectory, name, generatorBundle } = appEntry;

  const projectDirectory = path.join(baseDirectory, packageDirectory);

  logger.info(`Generating project ${name} in ${projectDirectory}...`);

  const project = await operations.buildGeneratorEntry(generatorBundle);
  const output = await operations.executeGeneratorEntry(project, {
    templateMetadataOptions: writeTemplateMetadataOptions,
  });

  if (abortSignal?.aborted) throw new CancelledSyncError();

  const resolvedSnapshotDirectory = resolveSnapshotDirectory(projectDirectory, {
    snapshotDir: snapshotDirectory,
  });

  const snapshot = await loadSnapshotManifest(resolvedSnapshotDirectory);

  logger.info('Project built! Writing output....');

  // load clean directory contents
  const previousGeneratedPayload =
    await operations.getPreviousGeneratedPayload(projectDirectory);

  if (previousGeneratedPayload) {
    logger.debug('Detected generated folder. Attempting 3-way merge...');
  }

  const generatedTemporaryDirectory = path.join(
    projectDirectory,
    'baseplate/.build/generated_tmp',
  );

  await mkdir(generatedTemporaryDirectory, { recursive: true });

  const ignorePatterns = await loadIgnorePatterns(projectDirectory).catch(
    (error: unknown) => {
      logger.warn(
        `Failed to load .baseplateignore patterns, proceeding without ignore filtering: ${String(error)}`,
      );
      return undefined;
    },
  );

  if (overwrite && snapshot) {
    logger.info(`Applying snapshot to generator output for ${name}...`);
  }

  const overwriteOptions: OverwriteOptions = {
    enabled: !!overwrite,
    applyDiff:
      snapshot &&
      (async (relativePath, generatedContents) => {
        const result = await applySnapshotToFileContents(
          relativePath,
          generatedContents,
          snapshot,
          resolvedSnapshotDirectory.diffsPath,
        );
        if (result === false) {
          logger.warn(
            `Snapshot for ${relativePath} was not applied because the patch was invalid. Please verify the new output and run snapshot add once the changes have been verified.`,
          );
        }
        return result;
      }),
    skipFile: (relativePath) => {
      if (!ignorePatterns) {
        return false;
      }
      return ignorePatterns.ignores(relativePath);
    },
  };

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
        overwriteOptions,
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
