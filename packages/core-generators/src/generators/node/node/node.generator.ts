import type { AnyGeneratorTask, TaskRunContext } from '@halfdomelabs/sync';
import type { InferFieldMapSchemaFromBuilder } from '@halfdomelabs/utils';

import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderType,
  POST_WRITE_COMMAND_PRIORITY,
} from '@halfdomelabs/sync';
import {
  createFieldMap,
  createFieldMapSchemaBuilder,
} from '@halfdomelabs/utils';
import semver from 'semver';
import sortPackageJson from 'sort-package-json';
import { z } from 'zod';

import { NODE_VERSION, PNPM_VERSION } from '@src/constants/node.js';
import { projectScope } from '@src/providers/scopes.js';
import { writeJsonToBuilder } from '@src/writers/json.js';

import type { NodePackageDependencies } from './package-dependencies-container.js';

import { projectProvider } from '../../../providers/index.js';
import { createNodePackageDependenciesContainer } from './package-dependencies-container.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  packageName: z.string().optional(),
  description: z.string().optional(),
  license: z.string().default('UNLICENSED'),
  version: z.string().default('0.1.0'),
  private: z.boolean().default(true),
  path: z.string().default(''),
  nodeVersion: z.string().default(NODE_VERSION),
  pnpmVersion: z.string().default(PNPM_VERSION),
});

const nodePackageJsonFieldsSchema = createFieldMapSchemaBuilder((t) => ({
  /**
   * The dependencies for the project
   */
  packages: createNodePackageDependenciesContainer(),
  /**
   * The scripts for the project
   */
  scripts: t.mapFromObj<string>({
    preinstall: 'npx only-allow pnpm',
  }),
  /**
   * Extra properties that the package.json will have
   */
  extraProperties: t.object({}),
}));

export interface NodeProvider
  extends InferFieldMapSchemaFromBuilder<typeof nodePackageJsonFieldsSchema> {
  /**
   * The version of node that will be used
   */
  nodeVersion: string;
  /**
   * Whether the project is using ESM
   */
  isEsm: boolean;
}

export const nodeProvider = createProviderType<NodeProvider>('node');

/**
 * Create a task that will run a function with the node provider
 * @param runner - The function to run with the node provider
 * @returns A generator task
 */
export function createNodeTask(
  runner: (provider: NodeProvider, context: TaskRunContext) => void,
): AnyGeneratorTask {
  return createGeneratorTask({
    dependencies: { node: nodeProvider },
    run: ({ node }, context) => {
      runner(node, context);
    },
  });
}

/**
 * Create a task that will add packages to the node provider
 * @param nodePackages - The packages to add
 * @returns A generator task
 */
export function createNodePackagesTask(
  nodePackages: Partial<NodePackageDependencies>,
): AnyGeneratorTask {
  return createGeneratorTask({
    dependencies: { node: nodeProvider },
    run: ({ node }) => {
      node.packages.addPackages(nodePackages);
    },
  });
}

const [configTask, nodeConfigProvider, nodeConfigValuesProvider] =
  createConfigProviderTask((t) => ({ isEsm: t.boolean(false) }), {
    prefix: 'node',
    configScope: projectScope,
  });

export { nodeConfigProvider };

export const nodeGenerator = createGenerator({
  name: 'node/node',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  scopes: [projectScope],
  buildTasks: (descriptor) => ({
    config: createGeneratorTask(configTask),
    project: createGeneratorTask({
      outputs: { project: projectProvider.export(projectScope) },
      run: () => ({
        build: () => ({ project: { getProjectName: () => descriptor.name } }),
      }),
    }),
    main: createGeneratorTask({
      dependencies: {
        nodeConfigValues: nodeConfigValuesProvider,
      },
      exports: {
        node: nodeProvider.export(projectScope),
      },
      run({ nodeConfigValues: { isEsm } }) {
        const packageJsonFields = createFieldMap(nodePackageJsonFieldsSchema);

        return {
          providers: {
            node: {
              ...packageJsonFields,
              nodeVersion: descriptor.nodeVersion,
              isEsm,
            },
          },
          build: (builder) => {
            const packageJsonValues = packageJsonFields.getValues();
            const packageJson = {
              name: descriptor.packageName ?? descriptor.name,
              description: descriptor.description,
              license: descriptor.license,
              version: descriptor.version,
              private: descriptor.private,
              ...packageJsonValues.extraProperties,
              scripts: Object.fromEntries(packageJsonValues.scripts),
              dependencies: packageJsonValues.packages.prod,
              devDependencies: packageJsonValues.packages.dev,
              engines: {
                node: `^${descriptor.nodeVersion}`,
                // use major/minor version of PNPM
                pnpm: `^${semver.major(descriptor.pnpmVersion)}.${semver.minor(
                  descriptor.pnpmVersion,
                )}.0`,
              },
              volta: {
                node: descriptor.nodeVersion,
              },
              type: isEsm ? 'module' : 'commonjs',
            };

            writeJsonToBuilder(builder, {
              id: 'package-json',
              destination: 'package.json',
              contents: sortPackageJson(packageJson),
            });

            builder.addPostWriteCommand('pnpm install', {
              workingDirectory: '/',
              onlyIfChanged: ['package.json'],
              priority: POST_WRITE_COMMAND_PRIORITY.DEPENDENCIES,
            });
          },
        };
      },
    }),
  }),
});
