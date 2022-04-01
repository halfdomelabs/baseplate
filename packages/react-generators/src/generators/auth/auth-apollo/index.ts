import { TypescriptCodeUtils } from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import * as yup from 'yup';
import { reactApolloSetupProvider } from '../../apollo/react-apollo';
import { authServiceProvider } from '../auth-service';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

export type AuthApolloProvider = unknown;

export const authApolloProvider =
  createProviderType<AuthApolloProvider>('auth-apollo');

const AuthApolloGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    reactApolloSetup: reactApolloSetupProvider.dependency().modifiedInBuild(),
    authService: authServiceProvider,
  },
  exports: {
    authApollo: authApolloProvider,
  },
  createGenerator(descriptor, { reactApolloSetup, authService }) {
    return {
      getProviders: () => ({
        authApollo: {},
      }),
      build: async (builder) => {
        const linkTemplate = await builder.readTemplate('auth-link.ts');
        const authLink = TypescriptCodeUtils.extractTemplateSnippet(
          linkTemplate,
          'AUTH_LINK'
        );

        reactApolloSetup.addLink({
          name: 'authLink',
          bodyExpression: TypescriptCodeUtils.createBlock(
            authLink,
            [
              'import { setContext } from "@apollo/client/link/context"',
              'import { authService } from "%auth-service"',
            ],
            { importMappers: [authService] }
          ),
          dependencies: [['refreshTokenLink', 'authLink']],
        });

        const refreshTokenLink = TypescriptCodeUtils.extractTemplateSnippet(
          linkTemplate,
          'REFRESH_TOKEN_LINK'
        );

        reactApolloSetup.addLink({
          name: 'refreshTokenLink',
          bodyExpression: TypescriptCodeUtils.createBlock(
            refreshTokenLink,
            [
              'import { onError } from "@apollo/client/link/error";',
              'import { authService } from "%auth-service"',
              'import { ServerError } from "@apollo/client/link/utils";',
            ],
            { importMappers: [authService] }
          ),
          dependencies: [['errorLink', 'refreshTokenLink']],
        });
      },
    };
  },
});

export default AuthApolloGenerator;
