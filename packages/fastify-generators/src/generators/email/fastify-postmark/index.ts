import {
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  tsCodeFragment,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';
import { configServiceProvider } from '@src/generators/core/config-service/config-service.generator.js';

const descriptorSchema = z.object({});

export type FastifyPostmarkProvider = unknown;

export const fastifyPostmarkProvider =
  createProviderType<FastifyPostmarkProvider>('fastify-postmark');

export const fastifyPostmarkGenerator = createGenerator({
  name: 'email/fastify-postmark',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, ['postmark']),
    }),
    main: createGeneratorTask({
      dependencies: {
        typescript: typescriptProvider,
        configService: configServiceProvider,
      },
      exports: {
        fastifyPostmark: fastifyPostmarkProvider.export(projectScope),
      },
      run({ typescript, configService }) {
        configService.configFields.set('POSTMARK_API_TOKEN', {
          comment: 'Postmark API token',
          validator: tsCodeFragment('z.string().min(1)'),
          seedValue: 'POSTMARK_API_TOKEN',
          exampleValue: 'POSTMARK_API_TOKEN',
        });

        return {
          providers: {
            fastifyPostmark: {},
          },
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
    }),
  }),
});
