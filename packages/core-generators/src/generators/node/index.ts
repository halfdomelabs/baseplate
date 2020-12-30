import {
  GeneratorDescriptor,
  createProviderType,
  createGeneratorConfig,
  createGeneratorDescriptor,
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

export interface NodeProvider {
  addPackage(name: string, version: string): void;
  addDevPackage(name: string, version: string): void;
}

export const nodeProvider = createProviderType<NodeProvider>('node');

type NodeDependencyType = 'normal' | 'dev';

interface NodeDependencyEntry {
  name: string;
  version: string;
  type: NodeDependencyType;
}

const NodeGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<Descriptor>(descriptorSchema),
  childGenerators: {
    projects: {
      multiple: true,
    },
    prettier: {
      provider: 'formatter',
      defaultDescriptor: {
        generator: '@baseplate/core/prettier',
        peerProvider: true,
      },
    },
  },
  exports: {
    node: nodeProvider,
  },
  createGenerator: (descriptor) => {
    const dependencies: Record<string, NodeDependencyEntry> = {};
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
          type: NodeDependencyType
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
});

export default NodeGenerator;
