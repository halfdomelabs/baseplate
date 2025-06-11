import {
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  tsCodeFragment,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';
import {
  configServiceImportsProvider,
  configServiceProvider,
} from '#src/generators/core/config-service/index.js';

import { EMAIL_FASTIFY_POSTMARK_TS_TEMPLATES } from './generated/ts-templates.js';

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
    config: createProviderTask(configServiceProvider, (configService) => {
      configService.configFields.set('POSTMARK_API_TOKEN', {
        comment: 'Postmark API token',
        validator: tsCodeFragment('z.string().min(1)'),
        seedValue: 'POSTMARK_API_TOKEN',
        exampleValue: 'POSTMARK_API_TOKEN',
      });
    }),
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        configServiceImports: configServiceImportsProvider,
      },
      exports: {
        fastifyPostmark: fastifyPostmarkProvider.export(projectScope),
      },
      run({ typescriptFile, configServiceImports }) {
        const postmarkPath = '@/src/services/postmark.ts';
        return {
          providers: {
            fastifyPostmark: {},
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: EMAIL_FASTIFY_POSTMARK_TS_TEMPLATES.postmark,
                destination: postmarkPath,
                importMapProviders: {
                  configServiceImports,
                },
                variables: {
                  // placeholder values for now
                  TPL_DEFAULT_FROM: "'<DEFAULT_FROM>'",
                  TPL_TEMPLATE_CONFIG: tsCodeFragment(
                    `{
                    TEST_EMAIL: {
                      alias: 'test-email',
                      schema: z.object({
                        name: z.string().min(1),
                      }),
                    },
                  }`,
                    tsImportBuilder(['z']).from('zod'),
                  ),
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
