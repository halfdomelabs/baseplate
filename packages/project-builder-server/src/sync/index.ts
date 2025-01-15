import type { AppEntry } from '@halfdomelabs/project-builder-lib';

import {
  type FileData,
  GeneratorEngine,
  type Logger,
} from '@halfdomelabs/sync';
import chalk from 'chalk';
import fs from 'fs-extra';
import { globby } from 'globby';
import path from 'node:path';

import { environmentFlags } from '@src/service/environment-flags.js';
import { removeEmptyAncestorDirectories } from '@src/utils/directories.js';

import { writeGeneratorStepsHtml } from './generator-steps-html-writer.js';

interface BuildResultFile {
  failedCommands?: string[];
}

interface GenerateForDirectoryOptions {
  baseDirectory: string;
  appEntry: AppEntry;
  logger: Logger;
}

async function getCleanDirectoryFiles(
  cleanDirectory: string,
): Promise<{ filePath: string; contents: Buffer }[] | null> {
  // check if the project directory exists
  const cleanDirectoryExists = await fs.pathExists(cleanDirectory);

  if (!cleanDirectoryExists) {
    return null;
  }

  const files = await globby('**/*', { cwd: cleanDirectory, dot: true });
  return Promise.all(
    files.map(async (filePath) => {
      const contents = await fs.readFile(path.join(cleanDirectory, filePath));
      return {
        filePath,
        contents,
      };
    }),
  );
}

export async function generateForDirectory({
  baseDirectory,
  appEntry,
  logger,
}: GenerateForDirectoryOptions): Promise<void> {
  const { appDirectory, name, generatorBundle } = appEntry;
  const engine = new GeneratorEngine();

  const projectDirectory = path.join(baseDirectory, appDirectory);
  const cleanDirectory = path.join(projectDirectory, 'baseplate/.clean');

  logger.info(`Generating project ${name} in ${projectDirectory}...`);

  const project = engine.loadProject(generatorBundle, logger);
  const output = await engine.build(project, logger);
  logger.info('Project built! Writing output....');

  // look for previous build result
  const buildResultPath = path.join(
    projectDirectory,
    'baseplate/build/last_build_result.json',
  );

  const buildResultExists = await fs.pathExists(buildResultPath);
  const oldBuildResult: BuildResultFile = buildResultExists
    ? ((await fs.readJson(buildResultPath)) as BuildResultFile)
    : {};

  // load clean directory contents
  const cleanProjectFiles = await getCleanDirectoryFiles(cleanDirectory);

  if (cleanProjectFiles) {
    logger.info(
      'Detected project clean folder. Attempting 3-way mediocre-merge...',
    );
  }

  const cleanTmpDirectory = path.join(
    projectDirectory,
    'baseplate/build/clean_tmp',
  );

  const augmentedOutput = cleanProjectFiles
    ? {
        ...output,
        files: new Map(
          [...output.files.entries()].map(
            ([filePath, data]): [string, FileData] => {
              const cleanFile = cleanProjectFiles.find(
                (f) => f.filePath === filePath,
              );

              return [
                filePath,
                {
                  ...data,
                  options: {
                    ...data.options,
                    cleanContents: cleanFile?.contents,
                  },
                },
              ];
            },
          ),
        ),
      }
    : output;

  try {
    const writeOutput = await engine.writeOutput(
      augmentedOutput,
      projectDirectory,
      {
        cleanDirectory: cleanTmpDirectory,
        rerunCommands: oldBuildResult.failedCommands,
      },
      logger,
    );

    if (buildResultExists) {
      await fs.rm(buildResultPath);
    }

    if (writeOutput.failedCommands.length > 0) {
      // write failed commands to a temporary file
      const buildResult: BuildResultFile = {
        failedCommands: writeOutput.failedCommands,
      };
      await fs.writeJSON(buildResultPath, buildResult, { spaces: 2 });
    }

    if (cleanProjectFiles) {
      // swap out clean directory with clean_tmp
      await fs.rm(cleanDirectory, { recursive: true });
    }

    await fs.move(cleanTmpDirectory, cleanDirectory);

    // find deleted files
    const deletedCleanFiles =
      cleanProjectFiles?.filter((f) => !output.files.has(f.filePath)) ?? [];

    await Promise.all(
      deletedCleanFiles.map(async (file) => {
        const pathToDelete = path.join(projectDirectory, file.filePath);
        const pathExists = await fs.pathExists(pathToDelete);
        if (!pathExists) {
          return;
        }
        const existingContents = await fs.readFile(pathToDelete);
        if (existingContents.equals(file.contents)) {
          logger.info(`Deleting ${file.filePath}...`);
          await fs.remove(pathToDelete);
        } else {
          logger.info(
            chalk.red(`${file.filePath} has been modified. Skipping delete.`),
          );
        }
      }),
    );

    if (deletedCleanFiles.length > 0) {
      // clean up empty directories
      await removeEmptyAncestorDirectories(
        deletedCleanFiles.map((f) => path.join(projectDirectory, f.filePath)),
        projectDirectory,
      );
    }

    if (
      environmentFlags.BASEPLATE_WRITE_GENERATOR_STEPS_HTML &&
      output.metadata
    ) {
      await writeGeneratorStepsHtml(output.metadata, projectDirectory);
    }

    if (writeOutput.failedCommands.length > 0) {
      logger.error(
        `Project successfully written but with failed commands! Please check logs for more info.`,
      );
    } else {
      logger.info('Project successfully generated!');
    }
  } finally {
    // attempt to remove any temporary directory
    await fs.rm(cleanTmpDirectory, { recursive: true }).catch(() => {
      /* ignore errors */
    });
  }
}

export async function generateCleanAppForDirectory({
  baseDirectory,
  appEntry: { appDirectory, name, generatorBundle },
  logger,
}: GenerateForDirectoryOptions): Promise<void> {
  const engine = new GeneratorEngine();

  const projectDirectory = path.join(baseDirectory, appDirectory);
  const cleanDirectory = path.join(projectDirectory, 'baseplate/.clean');

  // delete clean project if exists
  const cleanProjectExists = await fs.pathExists(cleanDirectory);

  if (cleanProjectExists) {
    await fs.rm(cleanDirectory, { recursive: true });
  }

  logger.info(`Generating clean project ${name} in ${cleanDirectory}...`);

  const project = engine.loadProject(generatorBundle, logger);
  const output = await engine.build(project, logger);
  logger.info('Project built! Writing output....');

  // strip out any post write commands
  await engine.writeOutput(
    {
      ...output,
      files: new Map(
        [...output.files.entries()].filter(
          ([, file]) =>
            // reject any files that are buffers since we can't merge them
            !(file.contents instanceof Buffer),
        ),
      ),
      postWriteCommands: [],
    },
    cleanDirectory,
    undefined,
    logger,
  );
  logger.info('Project successfully written to clean project!');
}
