import {
  nodeProvider,
  projectScope,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { configServiceProvider } from '@src/generators/core/config-service/index.js';

const descriptorSchema = z.object({});

export type FastifyPostmarkProvider = unknown;

export const fastifyPostmarkProvider =
  createProviderType<FastifyPostmarkProvider>('fastify-postmark');

const createMainTask = createTaskConfigBuilder(() => ({
  name: 'main',
  dependencies: {
    node: nodeProvider,
    typescript: typescriptProvider,
    configService: configServiceProvider,
  },
  exports: {
    fastifyPostmark: fastifyPostmarkProvider.export(projectScope),
  },
  run({ node, typescript, configService }) {
    node.addPackages({
      postmark: '4.0.2',
    });
    configService.getConfigEntries().set('POSTMARK_API_TOKEN', {
      comment: 'Postmark API token',
      value: 'z.string().min(1)',
      seedValue: 'POSTMARK_API_TOKEN',
      exampleValue: 'POSTMARK_API_TOKEN',
    });

    return {
      getProviders: () => ({
        fastifyPostmark: {},
      }),
      build: async (builder) => {
        await builder.apply(
          typescript.createCopyFilesAction({
            destinationBaseDirectory: 'src',
            paths: ['services/postmark.ts'],
            importMappers: [configService],
          }),
        );
      },
    };
  },
}));

const FastifyPostmarkGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default FastifyPostmarkGenerator;
