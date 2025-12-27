import { tsCodeFragment } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { serviceContextConfigProvider } from '#src/generators/core/service-context/index.js';

import { PRISMA_PRISMA_AUTHORIZER_UTILS_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Generator for prisma/authorizer-utils
 */
export const authorizerUtilsGenerator = createGenerator({
  name: 'prisma/authorizer-utils',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: GENERATED_TEMPLATES.paths.task,
    imports: GENERATED_TEMPLATES.imports.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    serviceContextConfig: createGeneratorTask({
      dependencies: {
        serviceContextConfig: serviceContextConfigProvider,
      },
      run({ serviceContextConfig }) {
        serviceContextConfig.contextFields.set('authorizerCache', {
          type: tsCodeFragment('Map<string, boolean>'),
          setter: 'new Map<string, boolean>()',
        });
        serviceContextConfig.contextFields.set('authorizerModelCache', {
          type: tsCodeFragment('Map<string, unknown>'),
          setter: 'new Map<string, unknown>()',
        });
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
              renderers.mainGroup.render({
                variables: {},
              }),
            );
          },
        };
      },
    }),
  }),
});
