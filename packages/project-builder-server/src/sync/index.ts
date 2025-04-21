import type { AppEntry } from '@halfdomelabs/project-builder-lib';
import type { Logger, PreviousGeneratedPayload } from '@halfdomelabs/sync';

import {
  createCodebaseFileReaderFromDirectory,
  deleteMetadataFiles,
  GeneratorEngine,
  readTemplateMetadataPaths,
  writeGeneratorsMetadata,
  writeTemplateMetadata,
} from '@halfdomelabs/sync';
import {
  dirExists,
  handleFileNotFoundError,
  readJsonWithSchema,
  writeJson,
} from '@halfdomelabs/utils/node';
import chalk from 'chalk';
import { rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

import { environmentFlags } from '@src/service/environment-flags.js';

import { writeGeneratorSteps } from './generator-steps-writer.js';

const buildResultFileSchema = z.object({
  failedCommands: z.array(z.string()).optional(),
});

type BuildResultFile = z.output<typeof buildResultFileSchema>;

interface GenerateForDirectoryOptions {
  baseDirectory: string;
  appEntry: AppEntry;
  logger: Logger;
  shouldWriteTemplateMetadata?: boolean;
}

// /**
//  * Rename the clean directory to the generated directory if it exists.
//  *
//  * The .clean directory was the old directory that was used to store the generated
//  * contents. Now we use the generated directory instead.
//  *
//  * @param projectDirectory - The project directory.
//  */
// async function renameCleanDirectoryIfExists(
//   projectDirectory: string,
// ): Promise<void> {
//   const generatedDirectory = path.join(projectDirectory, GENERATED_DIRECTORY);
//   const cleanDirectory = path.join(projectDirectory, 'baseplate/.clean');
//   const cleanDirectoryExists = await fs.pathExists(cleanDirectory);
//   if (cleanDirectoryExists) {
//     await fs.rename(cleanDirectory, generatedDirectory);
//   }
// }

const GENERATED_DIRECTORY = 'baseplate/.clean';
const FILE_ID_MAP_PATH = 'baseplate/file-id-map.json';

async function getPreviousGeneratedFileIdMap(
  projectDirectory: string,
): Promise<Map<string, string>> {
  const generatedFileIdMapPath = path.join(projectDirectory, FILE_ID_MAP_PATH);
  try {
    const fileIdMap = await readJsonWithSchema(
      generatedFileIdMapPath,
      z.record(z.string(), z.string()),
    ).catch(handleFileNotFoundError);

    if (!fileIdMap) {
      return new Map();
    }

    return new Map(Object.entries(fileIdMap));
  } catch (err) {
    throw new Error(
      `Failed to get previous generated file id map (${generatedFileIdMapPath}): ${String(err)}`,
      { cause: err },
    );
  }
}

async function getPreviousGeneratedPayload(
  projectDirectory: string,
): Promise<PreviousGeneratedPayload | undefined> {
  const generatedDirectory = path.join(projectDirectory, GENERATED_DIRECTORY);

  const previousDirectoryExists = await dirExists(generatedDirectory);

  if (!previousDirectoryExists) {
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
  shouldWriteTemplateMetadata,
}: GenerateForDirectoryOptions): Promise<void> {
  const { appDirectory, name, generatorBundle } = appEntry;
  const engine = new GeneratorEngine();

  const projectDirectory = path.join(baseDirectory, appDirectory);

  logger.info(`Generating project ${name} in ${projectDirectory}...`);

  const metadataPaths = shouldWriteTemplateMetadata
    ? new Set(await readTemplateMetadataPaths(projectDirectory))
    : new Set();

  const project = await engine.loadProject(generatorBundle, logger);
  const output = await engine.build(project, {
    logger,
    templateMetadataOptions: {
      includeTemplateMetadata: shouldWriteTemplateMetadata ?? false,
      hasTemplateMetadata: (projectRelativePath) =>
        metadataPaths.has(projectRelativePath),
    },
  });
  logger.info('Project built! Writing output....');

  // look for previous build result
  const buildResultPath = path.join(
    projectDirectory,
    'baseplate/build/last_build_result.json',
  );

  const oldBuildResult = await readJsonWithSchema(
    buildResultPath,
    buildResultFileSchema,
  ).catch(handleFileNotFoundError);

  // load clean directory contents
  const previousGeneratedPayload =
    await getPreviousGeneratedPayload(projectDirectory);

  if (previousGeneratedPayload) {
    logger.info('Detected generated folder. Attempting 3-way merge...');
  }

  const generatedTemporaryDirectory = path.join(
    projectDirectory,
    'baseplate/build/generated_tmp',
  );

  try {
    const {
      failedCommands,
      relativePathsPendingDelete,
      relativePathsWithConflicts,
      fileIdToRelativePathMap,
    } = await engine.writeOutput(output, projectDirectory, {
      previousGeneratedPayload,
      generatedContentsDirectory: generatedTemporaryDirectory,
      rerunCommands: oldBuildResult?.failedCommands,
      logger,
      mergeDriver: environmentFlags.BASEPLATE_CUSTOM_MERGE_DRIVER
        ? {
            name: 'baseplate-custom-merge-driver',
            driver: environmentFlags.BASEPLATE_CUSTOM_MERGE_DRIVER,
          }
        : undefined,
    });

    // write metadata to the generated directory
    if (shouldWriteTemplateMetadata) {
      await deleteMetadataFiles(projectDirectory);
      await writeGeneratorsMetadata(project, projectDirectory);
      await writeTemplateMetadata(output.files, projectDirectory);
    }

    if (oldBuildResult) {
      await rm(buildResultPath);
    }

    if (failedCommands.length > 0) {
      // write failed commands to a temporary file
      const buildResult: BuildResultFile = {
        failedCommands,
      };
      await writeJson(buildResultPath, buildResult);
    }

    // swap out generated directory with generated_tmp
    const generatedDirectory = path.join(projectDirectory, GENERATED_DIRECTORY);
    if (previousGeneratedPayload) {
      await rm(generatedDirectory, { recursive: true });
    }
    await rename(generatedTemporaryDirectory, generatedDirectory);

    // Write file ID map
    const fileIdMap = Object.fromEntries(
      [...fileIdToRelativePathMap.entries()].sort(([a], [b]) =>
        a.localeCompare(b),
      ),
    );
    await writeJson(path.join(projectDirectory, FILE_ID_MAP_PATH), fileIdMap);

    // List out conflicts
    if (relativePathsWithConflicts.length > 0) {
      logger.warn(
        chalk.red(
          `Conflicts occurred while writing files:\n${relativePathsWithConflicts.join(
            '\n',
          )}`,
        ),
      );
      if (failedCommands.length > 0) {
        logger.warn(
          `\nOnce resolved, please re-run the generator or run the following commands:`,
        );
        for (const command of failedCommands) {
          logger.warn(`  ${command}`);
        }
      }
    }

    if (relativePathsPendingDelete.length > 0) {
      logger.warn(
        chalk.red(
          `Files were removed in the new generation but were modified so could not be automatically deleted:\n${relativePathsPendingDelete.join(
            '\n',
          )}`,
        ),
      );
    }

    if (
      environmentFlags.BASEPLATE_WRITE_GENERATOR_STEPS_JSON &&
      output.metadata
    ) {
      await writeGeneratorSteps(output.metadata, projectDirectory);
    }

    if (failedCommands.length > 0) {
      logger.error(
        `Project successfully written but with failed commands! Please check logs for more info.`,
      );
    } else {
      logger.info('Project successfully generated!');
    }
  } finally {
    // attempt to remove any temporary directory
    await rm(generatedTemporaryDirectory, { recursive: true }).catch(() => {
      /* ignore errors */
    });
  }
}
