/* eslint-disable no-console */

import path from 'path';
import { GeneratorEngine, loadGeneratorsForModule } from '@halfdomelabs/sync';
import { program } from 'commander';
import R from 'ramda';
import resolve from 'resolve';

const GENERATOR_MODULES = [
  '@halfdomelabs/core-generators',
  '@halfdomelabs/fastify-generators',
  '@halfdomelabs/react-generators',
];

const resolveAsync = (moduleName: string): Promise<string> =>
  new Promise((resolvePromise, rejectPromise) => {
    resolve(moduleName, (err, resolvedPath) => {
      if (!resolvedPath) {
        rejectPromise(
          new Error(
            `Could not resolve module ${moduleName} from ${process.cwd()}`
          )
        );
      } else if (err) {
        rejectPromise(err);
      } else {
        resolvePromise(resolvedPath);
      }
    });
  });

let cachedEngine: GeneratorEngine;
async function getGeneratorEngine(): Promise<GeneratorEngine> {
  if (!cachedEngine) {
    const resolvedGeneratorPaths = await Promise.all(
      GENERATOR_MODULES.map(
        async (moduleName): Promise<[string, string]> => [
          moduleName,
          path.dirname(
            await resolveAsync(path.join(moduleName, 'package.json'))
          ),
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

async function generateForDirectory(directory: string): Promise<void> {
  const engine = await getGeneratorEngine();
  const project = await engine.loadProject(directory);
  const output = await engine.build(project);
  console.log('Project built! Writing output....');
  await engine.writeOutput(output, directory);
  console.log('Project successfully generated!');
}

async function getVersion(): Promise<string> {
  const packageJson = (await import(
    path.resolve(__dirname, '../package.json')
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
