import type { AnyGeneratorTask, TaskRunContext } from '@baseplate-dev/sync';
import type {
  FieldMap,
  InferFieldMapSchemaFromBuilder,
} from '@baseplate-dev/utils';

import {
  createConfigFieldMap,
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderType,
  POST_WRITE_COMMAND_PRIORITY,
} from '@baseplate-dev/sync';
import { createFieldMapSchemaBuilder } from '@baseplate-dev/utils';
import semver from 'semver';
import sortPackageJson from 'sort-package-json';
import { z } from 'zod';

import { NODE_VERSION, PNPM_VERSION } from '#src/constants/node.js';
import { pathRootsProvider } from '#src/generators/metadata/index.js';
import { packageScope } from '#src/providers/scopes.js';
import { writeJsonToBuilder } from '#src/writers/json.js';

import type { NodePackageDependencies } from './package-dependencies-container.js';

import { packageInfoProvider } from '../../../providers/index.js';
import { createNodePackageDependenciesContainer } from './package-dependencies-container.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  packageName: z.string().optional(),
  description: z.string().optional(),
  license: z.string().default('UNLICENSED'),
  version: z.string().default('0.1.0'),
  private: z.boolean().default(true),
  scripts: z.record(z.string(), z.string()).default({}),
  nodeVersion: z.string().default(NODE_VERSION),
  pnpmVersion: z.string().default(PNPM_VERSION),
  rootPackage: z.boolean().default(false),
  additionalPackages: z
    .object({
      prod: z.record(z.string(), z.string()).default({}),
      dev: z.record(z.string(), z.string()).default({}),
    })
    .prefault({}),
});

const nodePackageJsonFieldsSchema = createFieldMapSchemaBuilder((t) => ({
  /**
   * The dependencies for the project
   */
  packages: createNodePackageDependenciesContainer(t.options),
  /**
   * The scripts for the project
   */
  scripts: t.mapFromObj<string>({
    preinstall: 'npx only-allow pnpm',
  }),
  /**
   * The files that the package.json will have
   */
  files: t.array<string>([], { stripDuplicates: true }),
  /**
   * Extra properties that the package.json will have
   */
  extraProperties: t.object({}),
}));

export interface NodeProvider extends InferFieldMapSchemaFromBuilder<
  typeof nodePackageJsonFieldsSchema
> {
  /**
   * The version of node that will be used
   */
  nodeVersion: string;
  /**
   * Whether the project is using ESM
   */
  isEsm: boolean;
}

export function createTestNodeProvider(): {
  nodeProvider: NodeProvider;
  nodeFieldMap: FieldMap<
    InferFieldMapSchemaFromBuilder<typeof nodePackageJsonFieldsSchema>
  >;
} {
  const configProvider = createConfigFieldMap(nodePackageJsonFieldsSchema);
  return {
    nodeProvider: {
      nodeVersion: NODE_VERSION,
      isEsm: true,
      ...configProvider,
    },
    nodeFieldMap: configProvider,
  };
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
  createConfigProviderTask((t) => ({ isEsm: t.boolean(true) }), {
    prefix: 'node',
    configScope: packageScope,
  });

export { nodeConfigProvider };

export const nodeGenerator = createGenerator({
  name: 'node/node',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  scopes: [packageScope],
  buildTasks: (descriptor) => ({
    config: createGeneratorTask(configTask),
    packageInfo: createGeneratorTask({
      outputs: { package: packageInfoProvider.export(packageScope) },
      run: () => ({
        build: () => ({
          package: {
            getPackageName: () => descriptor.name,
            getPackageRoot: () => '@',
            getPackageSrcPath: () => '@/src',
          },
        }),
      }),
    }),
    pathRoots: createGeneratorTask({
      dependencies: {
        pathRoots: pathRootsProvider,
        packageInfo: packageInfoProvider,
      },
      run({ pathRoots, packageInfo }) {
        pathRoots.registerPathRoot(
          'package-root',
          packageInfo.getPackageRoot(),
        );
        pathRoots.registerPathRoot('src-root', packageInfo.getPackageSrcPath());
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        nodeConfigValues: nodeConfigValuesProvider,
      },
      exports: {
        node: nodeProvider.export(packageScope),
      },
      run({ nodeConfigValues: { isEsm } }) {
        const packageJsonFields = createConfigFieldMap(
          nodePackageJsonFieldsSchema,
        );

        // Add scripts to the packageJsonFields
        packageJsonFields.scripts.mergeObj(descriptor.scripts, 'descriptor');

        // Add additional packages to the packageJsonFields
        packageJsonFields.packages.addPackages(descriptor.additionalPackages);

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
              files:
                packageJsonValues.files.length > 0
                  ? packageJsonValues.files.toSorted()
                  : undefined,
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
              packageManager: descriptor.rootPackage
                ? `pnpm@${descriptor.pnpmVersion}`
                : undefined,
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
