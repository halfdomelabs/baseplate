import path from 'path';
import { ProjectEntry } from '@baseplate/project-builder-lib';
import { GeneratorEngine, loadGeneratorsForModule } from '@baseplate/sync';
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
  { rootDirectory, name }: ProjectEntry
): Promise<void> {
  const engine = await getGeneratorEngine();

  const projectDirectory = path.join(baseDirectory, rootDirectory);

  console.log(`Generating project ${name} in ${projectDirectory}...`);

  const project = await engine.loadProject(projectDirectory);
  const output = await engine.build(project);
  console.log('Project built! Writing output....');

  await engine.writeOutput(output, projectDirectory);
  console.log('Project successfully generated!');

  // TODO: Strip out unused files
}
