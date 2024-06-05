import {
  TypescriptCodeUtils,
  nodeProvider,
  vitestProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export type FastifyVitestProvider = unknown;

export const fastifyVitestProvider =
  createProviderType<FastifyVitestProvider>('fastify-vitest');

const FastifyVitestGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    vitest: vitestProvider,
    node: nodeProvider,
  },
  exports: {
    fastifyVitest: fastifyVitestProvider,
  },
  createGenerator(descriptor, { node, vitest }) {
    // add config to vitest setup

    vitest
      .getConfig()
      .appendUnique('customSetupBlocks', [
        TypescriptCodeUtils.createBlock(
          'config()',
          "import { config } from 'dotenv'",
        ),
      ]);

    node.addScript('test', 'vitest run');
    node.addScript('test:unit', 'cross-env TEST_MODE=unit vitest run .unit.');

    return {
      getProviders: () => ({
        fastifyVitest: {},
      }),
    };
  },
});

export default FastifyVitestGenerator;
