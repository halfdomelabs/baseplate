import { Logger } from '@halfdomelabs/sync';
import fs from 'fs-extra';
import { createRequire } from 'module';
import path from 'node:path';
import { packageUp } from 'package-up';

import { GeneratorEngineSetupConfig } from '@src/sync/index.js';
import { notEmpty } from '@src/utils/array.js';
import { InitializeServerError } from '@src/utils/errors.js';

/**
 * Finds the available generators in the package.
 */
export async function discoverGenerators(
  packageDirectory: string,
  logger: Logger,
): Promise<GeneratorEngineSetupConfig> {
  const packageJsonPath = await packageUp({ cwd: packageDirectory });

  if (!packageJsonPath) {
    throw new InitializeServerError(
      'Could not find root package.json file for the Baseplate project',
      'Make sure the project.json file is inside a valid Node package with @halfdomelabs/project-builder-cli.',
    );
  }

  // Load the package.json file
  const packageJson = (await fs.readJson(packageJsonPath).catch(() => {
    throw new InitializeServerError(
      `Could not read the root package.json file for the Baseplate project at ${packageJsonPath}.`,
      'Make sure the package.json file is a valid JSON file.',
    );
  })) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  // Look for generators that are like @halfdomelabs/*-generators, start with baseplate-plugin- or @scope/baseplate-plugin-
  const generatorPackageNames = [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ].filter(
    (name) =>
      (name.startsWith('@halfdomelabs/') && name.endsWith('-generators')) ||
      name.startsWith('baseplate-plugin-') ||
      name.match(/^@[^/]+\/baseplate-plugin-/),
  );

  const require = createRequire(packageDirectory);

  // Load all valid generators
  const resolvedGeneratorPaths = await Promise.all(
    generatorPackageNames.map(async (packageName) => {
      const packagePath = path.dirname(
        require.resolve(packageName, {
          paths: [packageDirectory],
        }),
      );
      if (!packagePath) {
        throw new Error(`Could not find package path for ${packageName}`);
      }
      const generatorPackageJsonPath = await packageUp({ cwd: packagePath });
      if (!generatorPackageJsonPath) {
        logger.error(
          `Could not find package.json file for the package ${packageName}.`,
        );
        return undefined;
      }
      return {
        name: packageName,
        path: path.dirname(packagePath),
      };
    }),
  );
  return { generatorPackages: resolvedGeneratorPaths.filter(notEmpty) };
}
