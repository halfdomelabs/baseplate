import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { APOLLO_APOLLO_ERROR_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

export const apolloErrorGenerator = createGenerator({
  name: 'apollo/apollo-error',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: APOLLO_APOLLO_ERROR_GENERATED.paths.task,
    imports: APOLLO_APOLLO_ERROR_GENERATED.imports.task,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        paths: APOLLO_APOLLO_ERROR_GENERATED.paths.provider,
      },
      run({ typescriptFile, paths }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: APOLLO_APOLLO_ERROR_GENERATED.templates.apolloError,
                destination: paths.apolloError,
              }),
            );
          },
        };
      },
    }),
  }),
});
