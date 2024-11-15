import { getDefaultGeneratorSetupConfig } from '@halfdomelabs/project-builder-common';
import { GeneratorEngine } from '@halfdomelabs/sync';
import { program } from 'commander';
import * as R from 'ramda';

import { getPackageVersion } from './version.js';

let cachedEngine: GeneratorEngine | undefined;

async function getGeneratorEngine(): Promise<GeneratorEngine> {
  if (!cachedEngine) {
    const resolvedGeneratorPaths =
      await getDefaultGeneratorSetupConfig(console);
    const generatorMap = R.fromPairs(
      resolvedGeneratorPaths.generatorPackages.map(({ name, path }) => [
        name,
        path,
      ]),
    );

    cachedEngine = new GeneratorEngine(generatorMap);
  }
  return cachedEngine;
}

async function generateForDirectory(directory: string): Promise<void> {
  const engine = await getGeneratorEngine();
  const project = await engine.loadProject(directory);
  const output = await engine.build(project);
  console.info('Project built! Writing output....');
  await engine.writeOutput(output, directory);
  console.info('Project successfully generated!');
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

try {
  await runMain();
} catch (error: unknown) {
  console.error(error);
}
