import {
  jestProvider,
  nodeProvider,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
} from '@baseplate/sync';
import * as yup from 'yup';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

export type FastifyJestProvider = unknown;

export const fastifyJestProvider =
  createProviderType<FastifyJestProvider>('fastify-jest');

const FastifyJestGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    jest: jestProvider,
    node: nodeProvider,
  },
  exports: {
    fastifyJest: fastifyJestProvider,
  },
  createGenerator(descriptor, { jest, node }) {
    // add config to jest setup
    jest
      .getConfig()
      .appendUnique('customSetupBlocks', [
        TypescriptCodeUtils.createBlock(
          'config()',
          "import { config } from 'dotenv'"
        ),
      ]);

    // have to run in band until we figure out how to parallelize integration tests
    node.addScript('test', 'jest --runInBand');
    node.addScript('test:unit', 'jest .unit.');

    return {
      getProviders: () => ({
        fastifyJest: {},
      }),
      build: async () => {},
    };
  },
});

export default FastifyJestGenerator;
