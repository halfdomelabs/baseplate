import {
  createProviderType,
  createGeneratorWithChildren,
  createNonOverwriteableMap,
  writeJsonAction,
} from '@halfdomelabs/sync';
import * as R from 'ramda';
import semver from 'semver';
import sortKeys from 'sort-keys';
import sortPackageJson from 'sort-package-json';
import { z } from 'zod';
import { projectProvider } from '../../../providers/index.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  packageName: z.string().optional(),
  description: z.string().optional(),
  license: z.string().default('UNLICENSED'),
  version: z.string().default('0.1.0'),
  private: z.boolean().default(true),
  path: z.string().default(''),
  nodeVersion: z.string().default('18.16.0'),
  pnpmVersion: z.string().default('8.6.9'),
});

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
}

export const nodeProvider = createProviderType<NodeProvider>('node');

type NodeDependencyType = 'normal' | 'dev';

interface NodeDependencyEntry {
  name: string;
  version: string;
  type: NodeDependencyType;
}

const NodeGenerator = createGeneratorWithChildren({
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
    jest: {
      provider: 'jest',
      defaultToNullIfEmpty: true,
      defaultDescriptor: {
        generator: '@halfdomelabs/core/node/jest',
        peerProvider: true,
      },
    },
  }),
  exports: {
    node: nodeProvider,
    project: projectProvider,
  },
  createGenerator: (descriptor) => {
    const dependencies: Record<string, NodeDependencyEntry> = {};
    const extraProperties = createNonOverwriteableMap({}, { name: 'node' });
    const scripts = createNonOverwriteableMap(
      { preinstall: 'npx only-allow pnpm' },
      { name: 'node-scripts' }
    );

    function mergeDependency(
      name: string,
      version: string,
      type: 'normal' | 'dev'
    ): void {
      const existingDependency = dependencies[name];

      if (!existingDependency) {
        dependencies[name] = { name, version, type };
      } else {
        const oldVersion = existingDependency.version;
        let newVersion: string | null = null;
        if (semver.subset(oldVersion, version)) {
          newVersion = oldVersion;
        } else if (semver.subset(version, oldVersion)) {
          newVersion = version;
        } else {
          throw new Error(
            `Could not add different versions for dependency: ${name} (${oldVersion}, ${version})`
          );
        }
        dependencies[name] = {
          name,
          version: newVersion,
          type:
            existingDependency.type === 'normal' || type === 'normal'
              ? 'normal'
              : 'dev',
        };
      }
    }

    return {
      getProviders: () => {
        function addPackage(name: string, version: string): void {
          mergeDependency(name, version, 'normal');
        }
        function addDevPackage(name: string, version: string): void {
          mergeDependency(name, version, 'dev');
        }
        return {
          node: {
            addPackage,
            addPackages(packages) {
              Object.entries(packages).forEach(([name, version]) =>
                addPackage(name, version)
              );
            },
            addDevPackage,
            addDevPackages(packages) {
              Object.entries(packages).forEach(([name, version]) =>
                addDevPackage(name, version)
              );
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
          },
          project: {
            getProjectName: () => descriptor.name,
          },
        };
      },
      build: async (builder) => {
        const extractDependencies = (
          type: NodeDependencyType
        ): Record<string, string> =>
          R.mergeAll(
            R.sortBy(
              R.prop('name'),
              Object.values(dependencies).filter((d) => d.type === type)
            ).map((d) => ({ [d.name]: d.version }))
          );
        const packageJson = {
          name: descriptor.packageName || descriptor.name,
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
              descriptor.pnpmVersion
            )}.0`,
          },
          volta: {
            node: descriptor.nodeVersion,
          },
        };

        await builder.apply(
          writeJsonAction({
            destination: 'package.json',
            contents: packageJson,
            preformat: (contents) => sortPackageJson(contents),
          })
        );

        // write node version so .pnpm can use it
        builder.writeFile(
          '.npmrc',
          `use-node-version=${descriptor.nodeVersion}`
        );

        // we have to avoid the prompt otherwise generation will hang
        // https://github.com/pnpm/pnpm/issues/6778
        builder.addPostWriteCommand(
          'pnpm install --config.confirmModulesPurge=false',
          'dependencies',
          {
            workingDirectory: '/',
          }
        );

        const allDependencies = R.mergeRight(
          packageJson.dependencies,
          packageJson.devDependencies
        );
        if (Object.keys(allDependencies).includes('prettier')) {
          builder.addPostWriteCommand(
            'pnpm prettier --write package.json',
            'dependencies',
            {
              workingDirectory: '/',
              onlyIfChanged: ['package.json'],
            }
          );
        }
      },
    };
  },
});

export default NodeGenerator;
