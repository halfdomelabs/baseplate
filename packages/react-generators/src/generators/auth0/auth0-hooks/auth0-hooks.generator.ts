import {
  projectScope,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  renderTextTemplateFileAction,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import {
  generatedGraphqlImportsProvider,
  reactApolloProvider,
} from '@src/generators/apollo/react-apollo/react-apollo.generator.js';
import {
  authHooksImportsProvider,
  authHooksProvider,
} from '@src/generators/auth/_providers/auth-hooks.js';
import { reactErrorImportsProvider } from '@src/generators/core/react-error/react-error.generator.js';

import { AUTH_0_AUTH_0_HOOKS_TEXT_TEMPLATES } from './generated/text-templates.js';
import { createAuth0HooksImports } from './generated/ts-import-maps.js';
import { AUTH_0_AUTH_0_HOOKS_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({
  userQueryName: z.string().default('user'),
});

export const auth0HooksGenerator = createGenerator({
  name: 'auth0/auth0-hooks',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ userQueryName }) => ({
    authHooksImports: createGeneratorTask({
      exports: {
        authHooksImports: authHooksImportsProvider.export(projectScope),
      },
      run() {
        return {
          providers: {
            authHooksImports: createAuth0HooksImports('@/src/hooks'),
          },
        };
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        reactApollo: reactApolloProvider,
        reactErrorImports: reactErrorImportsProvider,
        generatedGraphqlImports: generatedGraphqlImportsProvider,
      },
      exports: {
        authHooks: authHooksProvider.export(projectScope),
      },
      run({
        typescriptFile,
        reactErrorImports,
        generatedGraphqlImports,
        reactApollo,
      }) {
        const useCurrentUserPath = '@/src/hooks/useCurrentUser.ts';
        const useLogOutPath = '@/src/hooks/useLogOut.ts';
        const useSessionPath = '@/src/hooks/useSession.ts';
        const useRequiredUserIdPath = '@/src/hooks/useRequiredUserId.ts';

        return {
          providers: {
            authHooks: {
              getImportMap: () => ({
                '%auth-hooks/useCurrentUser': {
                  path: useCurrentUserPath.replace('.ts', ''),
                  allowedImports: ['useCurrentUser'],
                },
                '%auth-hooks/useLogOut': {
                  path: useLogOutPath.replace('.ts', ''),
                  allowedImports: ['useLogOut'],
                },
                '%auth-hooks/useRequiredUserId': {
                  path: useRequiredUserIdPath.replace('.ts', ''),
                  allowedImports: ['useRequiredUserId'],
                },
                '%auth-hooks/useSession': {
                  path: useSessionPath.replace('.ts', ''),
                  allowedImports: ['useSession'],
                },
              }),
            },
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: AUTH_0_AUTH_0_HOOKS_TS_TEMPLATES.hooksGroup,
                baseDirectory: '@/src/hooks',
                variables: {
                  useCurrentUser: {
                    TPL_USER: userQueryName,
                  },
                },
                importMapProviders: {
                  generatedGraphqlImports,
                  reactErrorImports,
                },
              }),
            );

            await builder.apply(
              renderTextTemplateFileAction({
                template: AUTH_0_AUTH_0_HOOKS_TEXT_TEMPLATES.useCurrentUserGql,
                destination: '@/src/hooks/useCurrentUser.gql',
                variables: {
                  TPL_USER_QUERY_NAME: userQueryName,
                },
              }),
            );

            reactApollo.registerGqlFile(`@/src/hooks/useCurrentUser.gql`);
          },
        };
      },
    }),
  }),
});
