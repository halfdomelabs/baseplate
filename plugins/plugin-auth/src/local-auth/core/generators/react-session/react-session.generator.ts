import { TsCodeUtils, tsImportBuilder } from '@baseplate-dev/core-generators';
import { reactAppConfigProvider } from '@baseplate-dev/react-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { LOCAL_AUTH_CORE_REACT_SESSION_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Generator for React session management
 */
export const reactSessionGenerator = createGenerator({
  name: 'local-auth/core/react-session',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: GENERATED_TEMPLATES.paths.task,
    imports: GENERATED_TEMPLATES.imports.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    reactAppConfig: createGeneratorTask({
      dependencies: {
        reactAppConfig: reactAppConfigProvider,
        paths: GENERATED_TEMPLATES.paths.provider,
      },
      run({ reactAppConfig, paths }) {
        reactAppConfig.renderWrappers.set('react-session', {
          wrap: (contents) =>
            TsCodeUtils.templateWithImports([
              tsImportBuilder(['UserSessionProvider']).from(
                paths.userSessionProvider,
              ),
            ])`<UserSessionProvider>${contents}</UserSessionProvider>`,
          type: 'router',
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
