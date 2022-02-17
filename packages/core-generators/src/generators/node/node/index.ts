import {
  createProviderType,
  createGeneratorWithChildren,
  createNonOverwriteableMap,
  writeJsonAction,
} from '@baseplate/sync';
import R from 'ramda';
import semver from 'semver';
import * as yup from 'yup';

const descriptorSchema = yup.object({
  name: yup.string().required(),
  description: yup.string(),
  license: yup.string().default('UNLICENSED'),
  version: yup.string().default('0.1.0'),
  private: yup.bool().default(true),
  path: yup.string().default(''),
  nodeVersion: yup.string().default('14.19.0'),
  yarnVersion: yup.string().default('1.22.17'),
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
        generator: '@baseplate/core/node/prettier',
        peerProvider: true,
      },
    },
    typescript: {
      provider: 'typescript',
      defaultDescriptor: {
        generator: '@baseplate/core/node/typescript',
        peerProvider: true,
      },
    },
    gitIgnore: {
      provider: 'node-git-ignore',
      defaultDescriptor: {
        generator: '@baseplate/core/node/node-git-ignore',
        peerProvider: true,
      },
    },
    eslint: {
      provider: 'eslint',
      defaultDescriptor: {
        generator: '@baseplate/core/node/eslint',
        peerProvider: true,
      },
    },
  }),
  exports: {
    node: nodeProvider,
  },
  createGenerator: (descriptor) => {
    const dependencies: Record<string, NodeDependencyEntry> = {};
    const extraProperties = createNonOverwriteableMap({}, { name: 'node' });
    const scripts = createNonOverwriteableMap({}, { name: 'node-scripts' });

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
          name: descriptor.name,
          description: descriptor.description,
          license: descriptor.license,
          version: descriptor.version,
          private: descriptor.private,
          ...extraProperties.value(),
          scripts: scripts.value(),
          dependencies: extractDependencies('normal'),
          devDependencies: extractDependencies('dev'),
          engines: {
            node: `^${descriptor.nodeVersion}`,
            yarn: `^${descriptor.yarnVersion}`,
          },
          volta: {
            node: descriptor.nodeVersion,
            yarn: descriptor.yarnVersion,
          },
        };

        await builder.apply(
          writeJsonAction({
            destination: 'package.json',
            contents: packageJson,
          })
        );

        builder.addPostWriteCommand('yarn install', {
          workingDirectory: '/',
          onlyIfChanged: ['package.json'],
        });

        const allDependencies = R.mergeRight(
          packageJson.dependencies,
          packageJson.devDependencies
        );
        if (Object.keys(allDependencies).includes('prettier')) {
          builder.addPostWriteCommand('yarn prettier --write package.json', {
            workingDirectory: '/',
            onlyIfChanged: ['package.json'],
          });
        }
      },
    };
  },
});

export default NodeGenerator;
