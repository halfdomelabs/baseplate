/* eslint-disable no-console */

import { GeneratorEngine, loadGeneratorsForModule } from '@baseplate/sync';
import { program } from 'commander';
import R from 'ramda';

const GENERATOR_MODULES = [
  '@baseplate/core-generators',
  '@baseplate/react-generators',
  '@baseplate/express-generators',
];

async function generateForDirectory(directory: string): Promise<void> {
  const generators = await Promise.all(
    GENERATOR_MODULES.map(loadGeneratorsForModule)
  );
  const generatorMap = R.mergeAll(generators);

  const engine = new GeneratorEngine(generatorMap);
  const project = await engine.loadProject(directory);
  const output = await engine.build(project);
  await engine.writeOutput(output, directory);
  console.log('Project successfully generated!');
}

async function runMain(): Promise<void> {
  program.version('0.0.1');
  program
    .command('generate <directory>')
    .description('Generates code for a given directory')
    .action(generateForDirectory);

  await program.parseAsync(process.argv);
}

runMain().catch((err) => console.error(err));
