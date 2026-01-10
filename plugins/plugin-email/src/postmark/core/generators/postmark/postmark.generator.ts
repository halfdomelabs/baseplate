import type { ConfigServiceField } from '@baseplate-dev/fastify-generators';

import {
  nodeProvider,
  tsCodeFragment,
  tsImportBuilder,
} from '@baseplate-dev/core-generators';
import { configServiceProvider } from '@baseplate-dev/fastify-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { emailConfigProvider } from '#src/email/core/generators/email-module/email-module.generator.js';

import { POSTMARK_CORE_POSTMARK_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Generator for postmark/core/postmark
 */
export const postmarkGenerator = createGenerator({
  name: 'postmark/core/postmark',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: GENERATED_TEMPLATES.paths.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    // Add POSTMARK_SERVER_TOKEN config field
    configService: createProviderTask(
      configServiceProvider,
      (configService) => {
        configService.configFields.set('POSTMARK_SERVER_TOKEN', {
          comment: 'Postmark API server token for sending emails',
          validator: tsCodeFragment(
            `z.string().min(1)`,
            tsImportBuilder().named('z').from('zod'),
          ),
          exampleValue: 'your-postmark-server-token',
        } satisfies ConfigServiceField);
      },
    ),
    // Add postmark package dependency
    node: createProviderTask(nodeProvider, (node) => {
      node.packages.addProdPackages({
        postmark: '4.0.5',
      });
    }),
    // Register the postmark adapter with the email module
    emailConfig: createGeneratorTask({
      dependencies: {
        paths: GENERATED_TEMPLATES.paths.provider,
        emailConfig: emailConfigProvider,
      },
      run({ paths, emailConfig }) {
        emailConfig.emailAdapter.set(
          tsCodeFragment(
            'postmarkEmailAdapter',
            tsImportBuilder(['postmarkEmailAdapter']).from(
              paths.postmarkService,
            ),
          ),
        );
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        renderers: GENERATED_TEMPLATES.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(
              renderers.postmarkService.render({
                variables: {},
              }),
            );
          },
        };
      },
    }),
  }),
});
