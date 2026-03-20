import {
  tsCodeFragment,
  tsImportBuilder,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { camelCase } from 'es-toolkit';
import { z } from 'zod';

import { emailConfigProvider } from '#src/email/core/generators/email-module/email-module.generator.js';

import { STUB_CORE_STUB_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({
  providerName: z.string().min(1),
});

/**
 * Generator for stub/core/stub
 */
export const stubGenerator = createGenerator({
  name: 'stub/core/stub',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ providerName }) => {
    const adapterName = `${camelCase(providerName)}EmailAdapter`;

    return {
      paths: GENERATED_TEMPLATES.paths.task,
      renderers: GENERATED_TEMPLATES.renderers.task,
      // Register the stub adapter with the email module
      emailConfig: createGeneratorTask({
        dependencies: {
          paths: GENERATED_TEMPLATES.paths.provider,
          emailConfig: emailConfigProvider,
        },
        run({ paths, emailConfig }) {
          emailConfig.emailAdapter.set(
            tsCodeFragment(
              adapterName,
              tsImportBuilder([adapterName]).from(paths.stubService),
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
                renderers.stubService.render({
                  variables: {
                    TPL_ADAPTER_NAME: adapterName,
                    TPL_PROVIDER_NAME: `'${providerName}'`,
                    TPL_LOG_MESSAGE: `'${providerName} email adapter: email logged (not sent)'`,
                  },
                }),
              );
            },
          };
        },
      }),
    };
  },
});
