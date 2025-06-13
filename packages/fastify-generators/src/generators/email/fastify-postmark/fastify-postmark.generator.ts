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

import { EMAIL_FASTIFY_POSTMARK_GENERATED } from './generated/index.js';

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
    paths: EMAIL_FASTIFY_POSTMARK_GENERATED.paths.task,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        configServiceImports: configServiceImportsProvider,
        paths: EMAIL_FASTIFY_POSTMARK_GENERATED.paths.provider,
      },
      exports: {
        fastifyPostmark: fastifyPostmarkProvider.export(projectScope),
      },
      run({ typescriptFile, configServiceImports, paths }) {
        return {
          providers: {
            fastifyPostmark: {},
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: EMAIL_FASTIFY_POSTMARK_GENERATED.templates.postmark,
                destination: paths.postmark,
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
