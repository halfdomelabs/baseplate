import { jestProvider, TypescriptCodeUtils } from '@baseplate/core-generators';
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
  },
  exports: {
    fastifyJest: fastifyJestProvider,
  },
  createGenerator(descriptor, { jest }) {
    // add config to jest setup
    jest
      .getConfig()
      .appendUnique('customSetupBlocks', [
        TypescriptCodeUtils.createBlock(
          'config()',
          "import { config } from 'dotenv'"
        ),
      ]);

    return {
      getProviders: () => ({
        fastifyJest: {},
      }),
      build: async () => {},
    };
  },
});

export default FastifyJestGenerator;
