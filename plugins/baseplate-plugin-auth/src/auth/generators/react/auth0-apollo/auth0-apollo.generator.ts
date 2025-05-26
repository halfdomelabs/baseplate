import {
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
} from '@halfdomelabs/core-generators';
import { reactApolloConfigProvider } from '@halfdomelabs/react-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

const descriptorSchema = z.object({});

export const authApolloGenerator = createGenerator({
  name: 'auth/auth-apollo',
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
            'const { getAccessTokenSilently: getAccessToken } = useAuth();',
            tsImportBuilder(['useAuth']).from('@auth/auth-react'),
          ),
        });

        return {
          providers: {
            authApollo: {},
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
