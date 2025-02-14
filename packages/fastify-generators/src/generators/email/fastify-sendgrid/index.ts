import {
  nodeProvider,
  projectScope,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createProviderType,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';
import { configServiceProvider } from '@src/generators/core/config-service/index.js';
import { loggerServiceProvider } from '@src/generators/core/logger-service/index.js';

const descriptorSchema = z.object({});

export type FastifySendgridProvider = unknown;

export const fastifySendgridProvider =
  createProviderType<FastifySendgridProvider>('fastify-sendgrid');

const createMainTask = createTaskConfigBuilder(() => ({
  name: 'main',
  dependencies: {
    node: nodeProvider,
    typescript: typescriptProvider,
    configService: configServiceProvider,
    loggerService: loggerServiceProvider,
  },
  exports: {
    fastifySendgrid: fastifySendgridProvider.export(projectScope),
  },
  run({ node, typescript, configService, loggerService }) {
    node.addPackages({
      '@sendgrid/mail': FASTIFY_PACKAGES['@sendgrid/mail'],
    });
    configService.getConfigEntries().set('SENDGRID_API_KEY', {
      comment: 'Sendgrid API token',
      value: 'z.string().min(1)',
      seedValue: 'SENDGRID_API_KEY',
      exampleValue: 'SENDGRID_API_KEY',
    });

    return {
      providers: {
        fastifySendgrid: {},
      },
      build: async (builder) => {
        await builder.apply(
          typescript.createCopyFilesAction({
            destinationBaseDirectory: 'src',
            paths: ['services/sendgrid.ts'],
            importMappers: [configService, loggerService],
          }),
        );
      },
    };
  },
}));

export const fastifySendgridGenerator = createGenerator({
  name: 'email/fastify-sendgrid',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});
