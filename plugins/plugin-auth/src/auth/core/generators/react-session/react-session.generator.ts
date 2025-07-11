import { renderTextTemplateFileAction } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { AUTH_CORE_REACT_SESSION_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Generator for React session management
 */
export const reactSessionGenerator = createGenerator({
  name: 'auth/core/react-session',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: GENERATED_TEMPLATES.paths.task,
    imports: GENERATED_TEMPLATES.imports.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        renderers: GENERATED_TEMPLATES.renderers.provider,
        paths: GENERATED_TEMPLATES.paths.provider,
      },
      run({ renderers, paths }) {
        return {
          build: async (builder) => {
            await builder.apply(
              renderers.mainGroup.render({
                variables: {},
              }),
            );
            await builder.apply(
              renderTextTemplateFileAction({
                destination: paths.userSessionCheckGql,
                template: GENERATED_TEMPLATES.templates.userSessionCheckGql,
                variables: {},
              }),
            );
          },
        };
      },
    }),
  }),
});
