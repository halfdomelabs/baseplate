import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { NODE_ROOT_README_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({
  projectName: z.string(),
});

/**
 * Generator for node/root-readme
 *
 * Adds a README.md file to the root of the project.
 */
export const rootReadmeGenerator = createGenerator({
  name: 'node/root-readme',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: (descriptor) => ({
    paths: GENERATED_TEMPLATES.paths.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        renderers: GENERATED_TEMPLATES.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(
              renderers.readme.render({
                variables: {
                  TPL_PROJECT: descriptor.projectName,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
