import { GeneratorEngineSetupConfig } from '@halfdomelabs/project-builder-server';
import { packageDirectory } from 'pkg-dir';

import { resolveModule } from '../utils/resolve.js';

const GENERATOR_MODULES = [
  '@halfdomelabs/core-generators',
  '@halfdomelabs/fastify-generators',
  '@halfdomelabs/react-generators',
];

export async function getGeneratorSetupConfig(): Promise<GeneratorEngineSetupConfig> {
  const resolvedGeneratorPaths = await Promise.all(
    GENERATOR_MODULES.map(async (moduleName) => {
      const packagePath = await packageDirectory({
        cwd: resolveModule(moduleName),
      });
      if (!packagePath) {
        throw new Error(`Could not find package path for ${moduleName}`);
      }
      return {
        name: moduleName,
        path: packagePath,
      };
    }),
  );
  return {
    generatorPackages: resolvedGeneratorPaths,
  };
}
