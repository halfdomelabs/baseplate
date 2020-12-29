import {
  GeneratorConfig,
  GeneratorDescriptor,
  createProviderType,
} from '@baseplate/sync';
import * as yup from 'yup';
import R from 'ramda';
import { writePackageJson } from './actions/writePackageJson';

interface Descriptor extends GeneratorDescriptor {
  name: string;
  description: string;
}

const descriptorSchema = {
  name: yup.string().required(),
  description: yup.string(),
};

interface NodeProvider {
  addPackage(name: string, version: string): void;
  addDevPackage(name: string, version: string): void;
}

export const NodeProviderType = createProviderType<NodeProvider>('node');

interface ProviderMap {
  node: NodeProvider;
}

type DependencyTypes = 'normal' | 'dev';

interface DependencyEntry {
  name: string;
  version: string;
  type: DependencyTypes;
}

const NodeGenerator: GeneratorConfig<Descriptor, ProviderMap> = {
  descriptorSchema,
  childGenerators: {
    projects: {
      multiple: true,
    },
    prettier: {
      defaultDescriptor: {
        generator: '@baseplate/core/prettier',
        peerProvider: true,
      },
    },
  },
  provides: ['node'],
  createGenerator: (descriptor) => {
    const dependencies: Record<string, DependencyEntry> = {};
    return {
      getProviders: () => {
        return {
          node: {
            addPackage: (name, version) => {
              if (dependencies[name]) {
                throw new Error(`cannot re-add package ${name}`);
              }
              dependencies[name] = { name, version, type: 'normal' };
            },
            addDevPackage: (name, version) => {
              if (dependencies[name]) {
                throw new Error(`cannot re-add package ${name}`);
              }
              dependencies[name] = { name, version, type: 'dev' };
            },
          },
        };
      },
      build: (context) => {
        const extractDependencies = (
          type: DependencyTypes
        ): Record<string, string> => {
          return R.mergeAll(
            Object.values(dependencies)
              .filter((d) => d.type === type)
              .map((d) => ({ [d.name]: d.version }))
          );
        };
        const packageJson = {
          name: descriptor.name,
          description: descriptor.description,
          dependencies: extractDependencies('normal'),
          devDependencies: extractDependencies('dev'),
        };
        context.addAction(
          writePackageJson({
            contents: packageJson,
          })
        );
      },
    };
  },
};

export default NodeGenerator;
