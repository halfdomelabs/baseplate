import {
  projectScope,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { apolloErrorProvider } from '@src/generators/apollo/apollo-error/index.js';
import { reactApolloSetupProvider } from '@src/generators/apollo/react-apollo/index.js';

const descriptorSchema = z.object({});

export type Auth0ApolloProvider = unknown;

export const auth0ApolloProvider =
  createProviderType<Auth0ApolloProvider>('auth0-apollo');

const Auth0ApolloGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    reactApolloSetup: reactApolloSetupProvider,
    apolloError: apolloErrorProvider,
  },
  exports: {
    auth0Apollo: auth0ApolloProvider.export(projectScope),
  },
  createGenerator(descriptor, { reactApolloSetup }) {
    reactApolloSetup.addCreateArg({
      name: 'getAccessToken',
      type: TypescriptCodeUtils.createExpression(
        '() => Promise<string | undefined>',
      ),
      creatorValue: TypescriptCodeUtils.createExpression(
        'getAccessTokenSilently',
      ),
      hookDependency: 'getAccessTokenSilently',
      renderBody: TypescriptCodeUtils.createBlock(
        'const { getAccessTokenSilently } = useAuth0();',
        "import { useAuth0 } from '@auth0/auth0-react';",
      ),
    });

    return {
      getProviders: () => ({
        auth0Apollo: {},
      }),
      build: async (builder) => {
        const linkTemplate = await builder.readTemplate('auth-link.ts');
        const authLink = TypescriptCodeUtils.extractTemplateSnippet(
          linkTemplate,
          'AUTH_LINK',
        );

        reactApolloSetup.addLink({
          name: 'authLink',
          bodyExpression: TypescriptCodeUtils.createBlock(authLink, [
            'import { setContext } from "@apollo/client/link/context"',
          ]),
          dependencies: [['errorLink', 'authLink']],
        });
      },
    };
  },
});

export default Auth0ApolloGenerator;
