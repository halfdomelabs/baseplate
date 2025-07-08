import type { AppEntry } from '@baseplate-dev/project-builder-lib';
import type {
  FileWithConflict,
  GeneratorEntry,
  GeneratorOutput,
  Logger,
  PreviousGeneratedPayload,
  TemplateMetadataOptions,
} from '@baseplate-dev/sync';

import {
  buildGeneratorEntry,
  CancelledSyncError,
  createCodebaseFileReaderFromDirectory,
  deleteMetadataFiles,
  executeGeneratorEntry,
  writeGeneratorOutput,
  writeTemplateInfoFiles,
} from '@baseplate-dev/sync';
import { randomKey } from '@baseplate-dev/utils';
import { dirExists } from '@baseplate-dev/utils/node';
import chalk from 'chalk';
import { mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';

import type { BaseplateUserConfig } from '#src/user-config/user-config-schema.js';

import type { PackageSyncResult } from './sync-metadata.js';

import {
  getPreviousGeneratedFileIdMap,
  writeGeneratedFileIdMap,
} from './file-id-map.js';
import { writeGeneratorSteps } from './generator-steps-writer.js';

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
}

export interface GeneratorOperations {
  buildGeneratorEntry: typeof buildGeneratorEntry;
  executeGeneratorEntry: typeof executeGeneratorEntry;
  getPreviousGeneratedPayload: typeof getPreviousGeneratedPayload;
  writeGeneratorOutput: typeof writeGeneratorOutput;
  writeMetadata: (
    project: GeneratorEntry,
    output: GeneratorOutput,
    projectDirectory: string,
  ) => Promise<void>;
  writeGeneratorSteps: typeof writeGeneratorSteps;
}

const defaultGeneratorOperations: GeneratorOperations = {
  buildGeneratorEntry,
  executeGeneratorEntry,
  getPreviousGeneratedPayload,
  writeGeneratorOutput,
  writeMetadata: async (project, output, projectDirectory) => {
    await deleteMetadataFiles(projectDirectory);
    await writeTemplateInfoFiles(output.files, projectDirectory);
  },
  writeGeneratorSteps,
};

const GENERATED_DIRECTORY = 'baseplate/generated';

async function getPreviousGeneratedPayload(
  projectDirectory: string,
): Promise<PreviousGeneratedPayload | undefined> {
  const generatedDirectory = path.join(projectDirectory, GENERATED_DIRECTORY);

  const generatedDirectoryExists = await dirExists(generatedDirectory);

  if (!generatedDirectoryExists) {
    return undefined;
  }

  const fileIdMap = await getPreviousGeneratedFileIdMap(projectDirectory);

  return {
    fileReader: createCodebaseFileReaderFromDirectory(generatedDirectory),
    fileIdToRelativePathMap: fileIdMap,
  };
}

export async function generateForDirectory({
  baseDirectory,
  appEntry,
  logger,
  writeTemplateMetadataOptions,
  userConfig,
  previousPackageSyncResult,
  operations = defaultGeneratorOperations,
  abortSignal,
  skipCommands,
}: GenerateForDirectoryOptions): Promise<PackageSyncResult> {
  const { appDirectory, name, generatorBundle } = appEntry;

  const projectDirectory = path.join(baseDirectory, appDirectory);

  logger.info(`Generating project ${name} in ${projectDirectory}...`);

  const project = await operations.buildGeneratorEntry(generatorBundle);
  const output = await operations.executeGeneratorEntry(project, {
    templateMetadataOptions: writeTemplateMetadataOptions,
  });

  if (abortSignal?.aborted) throw new CancelledSyncError();

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
