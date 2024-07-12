import { GeneratorEngineSetupConfig } from '@halfdomelabs/project-builder-server';
import _ from 'lodash';
import { packageDirectory } from 'pkg-dir';

import { getBuiltInPlugins } from './plugins.js';
import { resolveModule } from '../utils/resolve.js';

const GENERATOR_MODULES = [
  '@halfdomelabs/core-generators',
  '@halfdomelabs/fastify-generators',
  '@halfdomelabs/react-generators',
];

export async function getGeneratorSetupConfig(): Promise<GeneratorEngineSetupConfig> {
  const builtInPlugins = await getBuiltInPlugins();
  const generatorPackages = [
    ...GENERATOR_MODULES,
    ..._.uniq(builtInPlugins.map((plugin) => plugin.packageName)),
  ];
  const resolvedGeneratorPaths = await Promise.all(
    generatorPackages.map(async (moduleName) => {
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
