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

import { RESEND_CORE_RESEND_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Generator for resend/core/resend
 */
export const resendGenerator = createGenerator({
  name: 'resend/core/resend',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: GENERATED_TEMPLATES.paths.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    // Add RESEND_API_KEY config field
    configService: createProviderTask(
      configServiceProvider,
      (configService) => {
        configService.configFields.set('RESEND_API_KEY', {
          comment: 'Resend API key for sending emails',
          validator: tsCodeFragment(
            `z.string().min(1)`,
            tsImportBuilder().named('z').from('zod'),
          ),
          exampleValue: 're_123456789',
        } satisfies ConfigServiceField);
      },
    ),
    // Add resend package dependency
    node: createProviderTask(nodeProvider, (node) => {
      node.packages.addProdPackages({
        resend: '6.9.4',
      });
    }),
    // Register the resend adapter with the email module
    emailConfig: createGeneratorTask({
      dependencies: {
        paths: GENERATED_TEMPLATES.paths.provider,
        emailConfig: emailConfigProvider,
      },
      run({ paths, emailConfig }) {
        emailConfig.emailAdapter.set(
          tsCodeFragment(
            'resendEmailAdapter',
            tsImportBuilder(['resendEmailAdapter']).from(paths.resendService),
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
              renderers.resendService.render({
                variables: {},
              }),
            );
          },
        };
      },
    }),
  }),
});
