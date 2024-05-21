import { nodeProvider, vitestProvider } from '@halfdomelabs/core-generators';
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
  createGenerator(descriptor, { node }) {
    node.addScript('test-vitest', 'vitest --threads=1');
    node.addScript('test-vitest:unit', "vitest --include '**/*.unit.*'");

    return {
      getProviders: () => ({
        fastifyVitest: {},
      }),
    };
  },
});

export default FastifyVitestGenerator;
