import path from 'path';
import { AppEntry } from '@baseplate/project-builder-lib';
import {
  FileData,
  GeneratorEngine,
  loadGeneratorsForModule,
} from '@baseplate/sync';
import chalk from 'chalk';
import fs from 'fs-extra';
import globby from 'globby';
import R from 'ramda';

const GENERATOR_MODULES = [
  '@baseplate/core-generators',
  '@baseplate/fastify-generators',
  '@baseplate/react-generators',
];

let cachedEngine: GeneratorEngine;

async function getGeneratorEngine(): Promise<GeneratorEngine> {
  if (!cachedEngine) {
    const generators = await Promise.all(
      GENERATOR_MODULES.map(loadGeneratorsForModule)
    );
    const generatorMap = R.mergeAll(generators);

    cachedEngine = new GeneratorEngine(generatorMap);
  }
  return cachedEngine;
}

export async function generateForDirectory(
  baseDirectory: string,
  appEntry: AppEntry
): Promise<void> {
  const { rootDirectory, name } = appEntry;
  const engine = await getGeneratorEngine();

  const projectDirectory = path.join(baseDirectory, rootDirectory);
  const cleanDirectory = path.join(projectDirectory, 'baseplate/.clean');

  console.log(`Generating project ${name} in ${projectDirectory}...`);

  const project = await engine.loadProject(projectDirectory);
  const output = await engine.build(project);
  console.log('Project built! Writing output....');

  // check if the project directory exists
  const cleanDirectoryExists = await fs.pathExists(cleanDirectory);
  console.log(cleanDirectory);

  if (!cleanDirectoryExists) {
    await engine.writeOutput(output, projectDirectory);
    console.log('Project successfully generated!');
  } else {
    console.log(
      'Detected project clean folder. Attempting 3-way mediocre-merge...'
    );

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

    await engine.writeOutput(augmentedOutput, projectDirectory);

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
          console.log(`Deleting ${file.filePath}...`);
          await fs.remove(pathToDelete);
        } else {
          console.log(
            chalk.red(`${file.filePath} has been modified. Skipping delete.`)
          );
        }
      })
    );

    console.log('Project successfully generated!');
  }
}

export async function generateCleanAppForDirectory(
  baseDirectory: string,
  { rootDirectory, name }: AppEntry
): Promise<void> {
  const engine = await getGeneratorEngine();

  const projectDirectory = path.join(baseDirectory, rootDirectory);
  const cleanDirectory = path.join(projectDirectory, 'baseplate/.clean');

  // delete clean project if exists
  const cleanProjectExists = await fs.pathExists(cleanDirectory);

  if (cleanProjectExists) {
    await fs.rmdir(cleanDirectory, { recursive: true });
  }

  console.log(`Generating clean project ${name} in ${cleanDirectory}...`);

  const project = await engine.loadProject(projectDirectory);
  const output = await engine.build(project);
  console.log('Project built! Writing output....');

  // strip out any post write commands
  await engine.writeOutput(
    { ...output, postWriteCommands: [] },
    cleanDirectory
  );
  console.log('Project successfully written to clean project!');
}
