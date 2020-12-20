import { Generator, GeneratorDescriptor } from '@baseplate/sync';

type Descriptor = GeneratorDescriptor;

const descriptorSchema = {};

const NodeGenerator: Generator<Descriptor> = {
  descriptorSchema,
  childGenerators: {
    node: {
      provider: 'node',
      defaultGenerator: '@baseplate/core/node',
    },
    prettier: {
      defaultGenerator: '@baseplate/core/prettier',
    },
  },
  build: (descriptor, context) => {},
};

export default NodeGenerator;
