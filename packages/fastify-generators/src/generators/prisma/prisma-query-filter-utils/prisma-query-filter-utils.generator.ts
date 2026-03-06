import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { PRISMA_PRISMA_QUERY_FILTER_UTILS_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Generator for prisma/prisma-query-filter-utils
 */
export const prismaQueryFilterUtilsGenerator = createGenerator({
  name: 'prisma/prisma-query-filter-utils',
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
              renderers.mainGroupGroup.render({
                variables: {},
              }),
            );
          },
        };
      },
    }),
  }),
});
