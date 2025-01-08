import type { InferGeneratorDescriptor } from '@halfdomelabs/sync';

import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
  writeJsonAction,
} from '@halfdomelabs/sync';
import { sortBy } from 'es-toolkit';
import * as R from 'ramda';
import semver from 'semver';
import sortKeys from 'sort-keys';
import sortPackageJson from 'sort-package-json';
import { z } from 'zod';

import { projectScope } from '@src/providers/scopes.js';

import { projectProvider } from '../../../providers/index.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  packageName: z.string().optional(),
  description: z.string().optional(),
  license: z.string().default('UNLICENSED'),
  version: z.string().default('0.1.0'),
  private: z.boolean().default(true),
  path: z.string().default(''),
  nodeVersion: z.string().default('20.18.1'),
  pnpmVersion: z.string().default('9.15.1'),
});

export type NodeGeneratorDescriptor = InferGeneratorDescriptor<
  typeof descriptorSchema
>;

export interface NodeSetupProvider {
  setIsEsm(isEsm: boolean): void;
}

export const nodeSetupProvider =
  createProviderType<NodeSetupProvider>('node-setup');

export interface NodeProvider {
  addPackage(name: string, version: string): void;
  addPackages(packages: Record<string, string>): void;
  addDevPackage(name: string, version: string): void;
  addDevPackages(packages: Record<string, string>): void;
  addScript(name: string, script: string): void;
  addScripts(scripts: Record<string, string>): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mergeExtraProperties(props: Record<string, any>): void;
  getNodeVersion(): string;
  isEsm(): boolean;
}

export const nodeProvider = createProviderType<NodeProvider>('node');

type NodeDependencyType = 'normal' | 'dev';

interface NodeDependencyEntry {
  name: string;
  version: string;
  type: NodeDependencyType;
}

const NodeGenerator = createGeneratorWithTasks({
  descriptorSchema,

  getDefaultChildGenerators: () => ({
    projects: {
      isMultiple: true,
    },
    prettier: {
      provider: 'formatter',
      defaultDescriptor: {
        generator: '@halfdomelabs/core/node/prettier',
        peerProvider: true,
      },
    },
    typescript: {
      provider: 'typescript',
      defaultDescriptor: {
        generator: '@halfdomelabs/core/node/typescript',
        peerProvider: true,
      },
    },
    gitIgnore: {
      provider: 'node-git-ignore',
      defaultDescriptor: {
        generator: '@halfdomelabs/core/node/node-git-ignore',
        peerProvider: true,
      },
    },
    eslint: {
      provider: 'eslint',
      defaultDescriptor: {
        generator: '@halfdomelabs/core/node/eslint',
        peerProvider: true,
      },
    },
    tsUtils: {
      provider: 'ts-utils',
      defaultDescriptor: {
        generator: '@halfdomelabs/core/node/ts-utils',
        peerProvider: true,
      },
    },
    vitest: {
      provider: 'vitest',
      defaultToNullIfEmpty: true,
      defaultDescriptor: {
        generator: '@halfdomelabs/core/node/vitest',
        peerProvider: true,
      },
    },
  }),

  buildTasks(taskBuilder, descriptor) {
    const setupTask = taskBuilder.addTask({
      name: 'setup',
      exports: {
        nodeSetup: nodeSetupProvider.export(projectScope),
      },
      run() {
        let isEsm = false;
        return {
          getProviders: () => ({
            nodeSetup: {
              setIsEsm(value) {
                isEsm = value;
              },
            },
          }),
          build: () => ({ isEsm }),
        };
      },
    });

    taskBuilder.addTask({
      name: 'main',
      exports: {
        node: nodeProvider.export(projectScope),
        project: projectProvider.export(projectScope),
      },
      taskDependencies: {
        setup: setupTask,
      },
      run(deps, { setup: { isEsm } }) {
        const dependencies = new Map<string, NodeDependencyEntry>();
        const extraProperties = createNonOverwriteableMap(
          { type: isEsm ? 'module' : 'commonjs' },
          { name: 'node' },
        );
        const scripts = createNonOverwriteableMap(
          { preinstall: 'npx only-allow pnpm' },
          { name: 'node-scripts' },
        );

        function mergeDependency(
          name: string,
          version: string,
          type: 'normal' | 'dev',
        ): void {
          const existingDependency = dependencies.get(name);

          if (existingDependency) {
            const oldVersion = existingDependency.version;
            let newVersion: string | null = null;
            if (semver.subset(oldVersion, version)) {
              newVersion = oldVersion;
            } else if (semver.subset(version, oldVersion)) {
              newVersion = version;
            } else {
              throw new Error(
                `Could not add different versions for dependency: ${name} (${oldVersion}, ${version})`,
              );
            }
            dependencies.set(name, {
              name,
              version: newVersion,
              type:
                existingDependency.type === 'normal' || type === 'normal'
                  ? 'normal'
                  : 'dev',
            });
          } else {
            dependencies.set(name, { name, version, type });
          }
        }

        function addPackage(name: string, version: string): void {
          mergeDependency(name, version, 'normal');
        }
        function addDevPackage(name: string, version: string): void {
          mergeDependency(name, version, 'dev');
        }

        return {
          getProviders: () => ({
            node: {
              addPackage,
              addPackages(packages) {
                for (const [name, version] of Object.entries(packages))
                  addPackage(name, version);
              },
              addDevPackage,
              addDevPackages(packages) {
                for (const [name, version] of Object.entries(packages))
                  addDevPackage(name, version);
              },
              mergeExtraProperties(props) {
                extraProperties.merge(props);
              },
              addScript(name, script) {
                scripts.merge({ [name]: script });
              },
              addScripts(value) {
                scripts.merge(value);
              },
              getNodeVersion() {
                return descriptor.nodeVersion;
              },
              isEsm() {
                return isEsm;
              },
            },
            project: {
              getProjectName: () => descriptor.name,
            },
          }),
          build: async (builder) => {
            const extractDependencies = (
              type: NodeDependencyType,
            ): Record<string, string> =>
              Object.fromEntries(
                sortBy(
                  [...dependencies.values()]
                    .filter((d) => d.type === type)
                    .map((d) => [d.name, d.version]),
                  [(d) => d[0]],
                ),
              );
            const packageJson = {
              name: descriptor.packageName ?? descriptor.name,
              description: descriptor.description,
              license: descriptor.license,
              version: descriptor.version,
              private: descriptor.private,
              ...sortKeys(extraProperties.value()),
              scripts: sortKeys(scripts.value()),
              dependencies: extractDependencies('normal'),
              devDependencies: extractDependencies('dev'),
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
            };

            const sortedPackageJsonContents = sortPackageJson(packageJson);

            await builder.apply(
              writeJsonAction({
                destination: 'package.json',
                contents: sortedPackageJsonContents,
              }),
            );

            // write node version so .pnpm can use it
            builder.writeFile(
              '.npmrc',
              `use-node-version=${descriptor.nodeVersion}`,
            );

            // we have to avoid the prompt otherwise generation will hang
            // https://github.com/pnpm/pnpm/issues/6778
            builder.addPostWriteCommand(
              'pnpm install --config.confirmModulesPurge=false',
              'dependencies',
              {
                workingDirectory: '/',
                onlyIfChanged: ['package.json'],
              },
            );

            const allDependencies = R.mergeRight(
              packageJson.dependencies,
              packageJson.devDependencies,
            );
            if (Object.keys(allDependencies).includes('prettier')) {
              builder.addPostWriteCommand(
                'pnpm prettier --write package.json',
                'dependencies',
                {
                  workingDirectory: '/',
                  onlyIfChanged: ['package.json'],
                },
              );
            }
          },
        };
      },
    });
  },
});

export default NodeGenerator;
