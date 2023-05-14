/* eslint-disable no-console */

import { resolve } from 'path';
import { GeneratorEngine, loadGeneratorsForModule } from '@halfdomelabs/sync';
import { program } from 'commander';
import R from 'ramda';

const GENERATOR_MODULES = [
  '@halfdomelabs/core-generators',
  '@halfdomelabs/fastify-generators',
  '@halfdomelabs/react-generators',
];

async function generateForDirectory(directory: string): Promise<void> {
  const generators = await Promise.all(
    GENERATOR_MODULES.map(loadGeneratorsForModule)
  );
  const generatorMap = R.mergeAll(generators);

  const engine = new GeneratorEngine(generatorMap);
  const project = await engine.loadProject(directory);
  const output = await engine.build(project);
  console.log('Project built! Writing output....');
  await engine.writeOutput(output, directory);
  console.log('Project successfully generated!');
}

async function getVersion(): Promise<string> {
  const packageJson = (await import(
    resolve(__dirname, '../package.json')
  )) as Record<string, string>;
  return packageJson?.version;
}

async function runMain(): Promise<void> {
  const version = await getVersion();
  program.version(version || 'unknown');
  program
    .command('generate <directory>')
    .description('Generates code for a given directory')
    .action(generateForDirectory);

  await program.parseAsync(process.argv);
}

runMain().catch((err) => console.error(err));
