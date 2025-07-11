import {
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
} from '@baseplate-dev/core-generators';
import { reactApolloConfigProvider } from '@baseplate-dev/react-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { reactSessionImportsProvider } from '../react-session';

const descriptorSchema = z.object({});

export const authApolloGenerator = createGenerator({
  name: 'auth/core/auth-apollo',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        reactApolloConfig: reactApolloConfigProvider,
        reactSession: reactSessionImportsProvider,
      },
      run({ reactApolloConfig, reactSession }) {
        reactApolloConfig.createApolloClientArguments.add({
          name: 'userSessionClient',
          type: reactSession.UserSessionClient.typeFragment(),
          reactRenderBody: tsCodeFragment(
            'const { client: userSessionClient } = useUserSessionClient();',
            reactSession.useUserSessionClient.declaration(),
          ),
        });

        return {
          providers: {
            authApollo: {},
          },
          build: async (builder) => {
            const linkTemplate = await builder.readTemplate(
              'session-error-link.ts',
            );
            const sessionErrorLink = TsCodeUtils.extractTemplateSnippet(
              linkTemplate,
              'SESSION_ERROR_LINK',
            );

            reactApolloConfig.apolloLinks.add({
              name: 'sessionErrorLink',
              bodyFragment: tsCodeFragment(sessionErrorLink, [
                tsImportBuilder(['onError']).from('@apollo/client/link/error'),
              ]),
              priority: 'error',
            });
          },
        };
      },
    }),
  }),
});
