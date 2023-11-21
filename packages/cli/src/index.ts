/* eslint-disable no-console */

import { GeneratorEngine, loadGeneratorsForModule } from '@halfdomelabs/sync';
import { program } from 'commander';
import { packageDirectory } from 'pkg-dir';
import * as R from 'ramda';

import { resolveModule } from './resolve.js';
import { getPackageVersion } from './version.js';

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
          })) ?? '',
        ],
      ),
    );
    const generators = await Promise.all(
      resolvedGeneratorPaths.map(([moduleName, modulePath]) =>
        loadGeneratorsForModule(moduleName, modulePath),
      ),
    );
    const generatorMap = R.mergeAll(generators);

    cachedEngine = new GeneratorEngine(generatorMap);
  }
  return cachedEngine;
}

async function generateForDirectory(directory: string): Promise<void> {
  const engine = await getGeneratorEngine();
  const project = await engine.loadProject(directory);
  const output = await engine.build(project);
  console.log('Project built! Writing output....');
  await engine.writeOutput(output, directory);
  console.log('Project successfully generated!');
}

async function runMain(): Promise<void> {
  const version = (await getPackageVersion()) ?? '0.0.0';
  program.version(version || 'unknown');
  program
    .command('generate <directory>')
    .description('Generates code for a given directory')
    .action(generateForDirectory);

  await program.parseAsync(process.argv);
}

runMain().catch((err) => console.error(err));
