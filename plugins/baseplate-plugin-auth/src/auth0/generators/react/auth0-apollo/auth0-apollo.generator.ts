import {
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
} from '@halfdomelabs/core-generators';
import { reactApolloConfigProvider } from '@halfdomelabs/react-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

const descriptorSchema = z.object({});

export const auth0ApolloGenerator = createGenerator({
  name: 'auth0/auth0-apollo',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        reactApolloConfig: reactApolloConfigProvider,
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
