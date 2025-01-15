import {
  projectScope,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import { createGenerator, createProviderType } from '@halfdomelabs/sync';
import { z } from 'zod';

import { reactApolloSetupProvider } from '../../apollo/react-apollo/index.js';
import { authServiceProvider } from '../auth-service/index.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export type AuthApolloProvider = unknown;

export const authApolloProvider =
  createProviderType<AuthApolloProvider>('auth-apollo');

export const authApolloGenerator = createGenerator({
  name: 'auth/auth-apollo',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        reactApolloSetup: reactApolloSetupProvider.dependency(),
        authService: authServiceProvider,
      },
      exports: {
        authApollo: authApolloProvider.export(projectScope),
      },
      run({ reactApolloSetup, authService }) {
        return {
          getProviders: () => ({
            authApollo: {},
          }),
          build: async (builder) => {
            const linkTemplate = await builder.readTemplate('auth-link.ts');
            const authLink = TypescriptCodeUtils.extractTemplateSnippet(
              linkTemplate,
              'AUTH_LINK',
            );

            reactApolloSetup.addLink({
              name: 'authLink',
              httpOnly: true,
              bodyExpression: TypescriptCodeUtils.createBlock(
                authLink,
                [
                  'import { setContext } from "@apollo/client/link/context"',
                  'import { authService } from "%auth-service"',
                ],
                { importMappers: [authService] },
              ),
              dependencies: [['refreshTokenLink', 'authLink']],
            });

            const refreshTokenLink = TypescriptCodeUtils.extractTemplateSnippet(
              linkTemplate,
              'REFRESH_TOKEN_LINK',
            );

            reactApolloSetup.addLink({
              name: 'refreshTokenLink',
              httpOnly: true,
              bodyExpression: TypescriptCodeUtils.createBlock(
                refreshTokenLink,
                [
                  'import { onError } from "@apollo/client/link/error";',
                  'import { authService } from "%auth-service"',
                  'import { ServerError } from "@apollo/client/link/utils";',
                ],
                { importMappers: [authService] },
              ),
              dependencies: [['errorLink', 'refreshTokenLink']],
            });

            reactApolloSetup.addWebsocketOption(
              'on',
              TypescriptCodeUtils.createExpression(
                `{
              closed: (e) => {
                if (e instanceof CloseEvent && e.reason === 'token-expired') {
                  authService.invalidateAccessToken();
                }
              },
          }`,
                'import { authService } from "%auth-service"',
                { importMappers: [authService] },
              ),
            );

            reactApolloSetup.addWebsocketOption(
              'connectionParams',
              TypescriptCodeUtils.createExpression(
                `async () => {
              const isAuthenticated = authService.isAuthenticated();
              if (!isAuthenticated) {
                return {};
              }
              const accessToken = await authService.getAccessToken();
              return { authorization: \`Bearer \${accessToken}\` };
            }`,
                'import { authService } from "%auth-service"',
                { importMappers: [authService] },
              ),
            );
          },
        };
      },
    });
  },
});
