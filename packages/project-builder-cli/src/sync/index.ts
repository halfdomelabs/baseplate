import path from 'path';
import { AppEntry } from '@baseplate/project-builder-lib';
import { GeneratorEngine, loadGeneratorsForModule } from '@baseplate/sync';
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

  if (!cleanDirectoryExists) {
    await engine.writeOutput(output, projectDirectory);
    console.log('Project successfully generated!');
  } else {
    // TODO: Figure out how to actually do 3-way merge despite formatters
    console.log('Detected project clean folder. Attempting mediocre-merge...');

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
    const strippedOutput = {
      ...output,
      files: R.mergeAll(
        Object.entries(output.files).map(([filePath, data]) => {
          const cleanFile = cleanProjectFiles.find(
            (f) => f.filePath === filePath
          );

          if (cleanFile?.contents === data.contents) {
            return {};
          }

          return {
            [filePath]: data,
          };
        })
      ),
    };

    await engine.writeOutput(strippedOutput, projectDirectory);
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
  const { files } = output;

  const noFormatFiles = R.mapObjIndexed(
    (val) => ({
      ...val,
      formatter: undefined,
      options: { ...val.options, shouldFormat: false },
    }),
    files
  );

  await engine.writeOutput(
    { files: noFormatFiles, postWriteCommands: [] },
    cleanDirectory
  );
  console.log('Project successfully written to clean project!');
}
