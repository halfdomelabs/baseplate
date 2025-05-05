import {
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { apolloErrorProvider } from '@src/generators/apollo/apollo-error/apollo-error.generator.js';
import { reactApolloConfigProvider } from '@src/generators/apollo/react-apollo/react-apollo.generator.js';

const descriptorSchema = z.object({});

export const auth0ApolloGenerator = createGenerator({
  name: 'auth0/auth0-apollo',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        reactApolloConfig: reactApolloConfigProvider,
        apolloError: apolloErrorProvider,
      },
      run({ reactApolloConfig }) {
        reactApolloConfig.createApolloClientArguments.add({
          name: 'getAccessToken',
          type: '() => Promise<string | undefined>',
          reactRenderBody: tsCodeFragment(
            'const { getAccessTokenSilently: getAccessToken } = useAuth0();',
            tsImportBuilder(['useAuth0']).from('@auth0/auth0-react'),
          ),
        });

        return {
          providers: {
            auth0Apollo: {},
          },
          build: async (builder) => {
            const linkTemplate = await builder.readTemplate('auth-link.ts');
            const authLink = TsCodeUtils.extractTemplateSnippet(
              linkTemplate,
              'AUTH_LINK',
            );

            reactApolloConfig.apolloLinks.add({
              name: 'authLink',
              bodyFragment: tsCodeFragment(authLink, [
                tsImportBuilder(['setContext']).from(
                  '@apollo/client/link/context',
                ),
              ]),
              priority: 'auth',
            });
          },
        };
      },
    }),
  }),
});
