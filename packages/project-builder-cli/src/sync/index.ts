import path from 'path';
import { AppEntry } from '@halfdomelabs/project-builder-lib';
import {
  FileData,
  GeneratorEngine,
  loadGeneratorsForModule,
  Logger,
} from '@halfdomelabs/sync';
import chalk from 'chalk';
import fs from 'fs-extra';
import { globby } from 'globby';
import { packageDirectory } from 'pkg-dir';
import * as R from 'ramda';
import { resolveModule } from '@src/utils/resolve.js';

const GENERATOR_MODULES = [
  '@halfdomelabs/core-generators',
  '@halfdomelabs/fastify-generators',
  '@halfdomelabs/react-generators',
];

let cachedEngine: GeneratorEngine;

async function getGeneratorEngine(): Promise<GeneratorEngine> {
  if (!cachedEngine) {
    const resolvedGeneratorPaths = await Promise.all(
      GENERATOR_MODULES.map(
        async (moduleName): Promise<[string, string]> => [
          moduleName,
          (await packageDirectory({
            cwd: resolveModule(moduleName),
          })) || '',
        ]
      )
    );
    const generators = await Promise.all(
      resolvedGeneratorPaths.map(([moduleName, modulePath]) =>
        loadGeneratorsForModule(moduleName, modulePath)
      )
    );
    const generatorMap = R.mergeAll(generators);

    cachedEngine = new GeneratorEngine(generatorMap);
  }
  return cachedEngine;
}

interface BuildResultFile {
  failedCommands?: string[];
}

export async function generateForDirectory(
  baseDirectory: string,
  appEntry: AppEntry,
  logger: Logger = console
): Promise<void> {
  const { rootDirectory, name } = appEntry;
  const engine = await getGeneratorEngine();

  const projectDirectory = path.join(baseDirectory, rootDirectory);
  const cleanDirectory = path.join(projectDirectory, 'baseplate/.clean');

  logger.log(`Generating project ${name} in ${projectDirectory}...`);

  const project = await engine.loadProject(projectDirectory, logger);
  const output = await engine.build(project, logger);
  logger.log('Project built! Writing output....');

  // check if the project directory exists
  const cleanDirectoryExists = await fs.pathExists(cleanDirectory);

  if (!cleanDirectoryExists) {
    await engine.writeOutput(output, projectDirectory, { cleanDirectory });
  } else {
    logger.log(
      'Detected project clean folder. Attempting 3-way mediocre-merge...'
    );
    const cleanTmpDirectory = path.join(
      projectDirectory,
      'baseplate/.clean_tmp'
    );

    try {
      // load clean directory contents
      const files = await globby('**/*', { cwd: cleanDirectory, dot: true });
      const cleanProjectFiles: { filePath: string; contents: string }[] =
        await Promise.all(
          files.map(async (filePath) => {
            const contents = await fs.readFile(
              path.join(cleanDirectory, filePath),
              'utf8'
            );
            return {
              filePath,
              contents,
            };
          })
        );

      const augmentedOutput = {
        ...output,
        files: R.mergeAll(
          Object.entries(output.files).map(
            ([filePath, data]): Record<string, FileData> => {
              const cleanFile = cleanProjectFiles.find(
                (f) => f.filePath === filePath
              );

              return {
                [filePath]: {
                  ...data,
                  options: {
                    ...data.options,
                    cleanContents: cleanFile?.contents,
                  },
                },
              };
            }
          )
        ),
      };

      // look for previous build result
      const buildResultPath = path.join(
        projectDirectory,
        'baseplate/.build_result.json'
      );

      const buildResultExists = await fs.pathExists(buildResultPath);
      const oldBuildResult: BuildResultFile = buildResultExists
        ? ((await fs.readJSON(buildResultPath)) as BuildResultFile)
        : {};

      const writeOutput = await engine.writeOutput(
        augmentedOutput,
        projectDirectory,
        {
          cleanDirectory: cleanTmpDirectory,
          rerunCommands: oldBuildResult.failedCommands,
        },
        logger
      );

      if (buildResultExists) {
        await fs.rm(buildResultPath);
      }

      if (writeOutput.failedCommands) {
        // write failed commands to a temporary file
        const buildResult: BuildResultFile = {
          failedCommands: writeOutput.failedCommands,
        };
        await fs.writeJSON(buildResultPath, buildResult, { spaces: 2 });
      }

      // swap out clean directory with clean_tmp
      await fs.rm(cleanDirectory, { recursive: true });
      await fs.move(cleanTmpDirectory, cleanDirectory);

      // find deleted files
      const deletedCleanFiles = cleanProjectFiles.filter(
        (f) => !output.files[f.filePath]
      );

      await Promise.all(
        deletedCleanFiles.map(async (file) => {
          const pathToDelete = path.join(projectDirectory, file.filePath);
          const pathExists = await fs.pathExists(pathToDelete);
          if (!pathExists) {
            return;
          }
          // TODO: Support binary support for files here
          const existingContents = await fs.readFile(pathToDelete, 'utf-8');
          if (existingContents === file.contents) {
            logger.log(`Deleting ${file.filePath}...`);
            await fs.remove(pathToDelete);
          } else {
            logger.log(
              chalk.red(`${file.filePath} has been modified. Skipping delete.`)
            );
          }
        })
      );
    } finally {
      // attempt to remove any temporary directory
      await fs.rm(cleanTmpDirectory, { recursive: true }).catch(() => {});
    }
  }

  logger.log('Project successfully generated!');
}

export async function generateCleanAppForDirectory(
  baseDirectory: string,
  { rootDirectory, name }: AppEntry,
  logger: Logger = console
): Promise<void> {
  const engine = await getGeneratorEngine();

  const projectDirectory = path.join(baseDirectory, rootDirectory);
  const cleanDirectory = path.join(projectDirectory, 'baseplate/.clean');

  // delete clean project if exists
  const cleanProjectExists = await fs.pathExists(cleanDirectory);

  if (cleanProjectExists) {
    await fs.rm(cleanDirectory, { recursive: true });
  }

  logger.log(`Generating clean project ${name} in ${cleanDirectory}...`);

  const project = await engine.loadProject(projectDirectory, logger);
  const output = await engine.build(project, logger);
  logger.log('Project built! Writing output....');

  // strip out any post write commands
  await engine.writeOutput(
    {
      ...output,
      files: R.mergeAll(
        Object.entries(output.files).map(([filePath, file]) => {
          // reject any files that are buffers since we can't merge them
          if (file.contents instanceof Buffer) {
            return {};
          }
          return {
            [filePath]: file,
          };
        })
      ),
      postWriteCommands: [],
    },
    cleanDirectory,
    undefined,
    logger
  );
  logger.log('Project successfully written to clean project!');
}
