import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { PRISMA_AUTHORIZER_UTILS_STUB_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Stub generator for prisma/authorizer-utils-stub.
 * Used for projects without authentication - exports stub types and functions
 * that match the full authorizer-utils API.
 */
export const authorizerUtilsStubGenerator = createGenerator({
  name: 'prisma/authorizer-utils-stub',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: GENERATED_TEMPLATES.paths.task,
    imports: GENERATED_TEMPLATES.imports.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
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
