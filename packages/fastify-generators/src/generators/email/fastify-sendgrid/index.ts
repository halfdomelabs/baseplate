import {
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';
import { configServiceProvider } from '@src/generators/core/config-service/index.js';
import { loggerServiceProvider } from '@src/generators/core/logger-service/logger-service.generator.js';

const descriptorSchema = z.object({});

export type FastifySendgridProvider = unknown;

export const fastifySendgridProvider =
  createProviderType<FastifySendgridProvider>('fastify-sendgrid');

export const fastifySendgridGenerator = createGenerator({
  name: 'email/fastify-sendgrid',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, ['@sendgrid/mail']),
    }),
    main: createGeneratorTask({
      dependencies: {
        typescript: typescriptProvider,
        configService: configServiceProvider,
        loggerService: loggerServiceProvider,
      },
      exports: {
        fastifySendgrid: fastifySendgridProvider.export(projectScope),
      },
      run({ typescript, configService, loggerService }) {
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
    }),
  }),
});
