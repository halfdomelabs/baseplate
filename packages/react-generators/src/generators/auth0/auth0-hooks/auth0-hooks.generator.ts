import {
  makeImportAndFilePath,
  projectScope,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  copyFileAction,
  createGenerator,
  createGeneratorTask,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { authHooksProvider } from '@src/generators/auth/auth-hooks/index.js';
import { reactErrorProvider } from '@src/generators/core/react-error/index.js';

import { reactApolloProvider } from '../../apollo/react-apollo/react-apollo.generator.js';

const descriptorSchema = z.object({
  userQueryName: z.string().default('user'),
});

export const auth0HooksGenerator = createGenerator({
  name: 'auth0/auth0-hooks',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ userQueryName }) => ({
    main: createGeneratorTask({
      dependencies: {
        typescript: typescriptProvider,
        reactApollo: reactApolloProvider,
        reactError: reactErrorProvider,
      },
      exports: {
        authHooks: authHooksProvider.export(projectScope),
      },
      run({ typescript, reactApollo, reactError }) {
        const currentUserFields: string[] = [];

        const hookFolder = 'src/hooks';
        const [useCurrentUserImport, useCurrentUserPath] =
          makeImportAndFilePath(`${hookFolder}/useCurrentUser.ts`);
        const [useLogOutImport, useLogOutPath] = makeImportAndFilePath(
          `${hookFolder}/useLogOut.ts`,
        );
        const [useSessionImport, useSessionPath] = makeImportAndFilePath(
          `${hookFolder}/useSession.ts`,
        );
        const [useRequiredUserIdImport, useRequiredUserIdPath] =
          makeImportAndFilePath(`${hookFolder}/useRequiredUserId.ts`);

        return {
          providers: {
            authHooks: {
              addCurrentUserField: (field: string) => {
                currentUserFields.push(field);
              },
              getImportMap: () => ({
                '%auth-hooks/useCurrentUser': {
                  path: useCurrentUserImport,
                  allowedImports: ['useCurrentUser'],
                },
                '%auth-hooks/useLogOut': {
                  path: useLogOutImport,
                  allowedImports: ['useLogOut'],
                },
                '%auth-hooks/useRequiredUserId': {
                  path: useRequiredUserIdImport,
                  allowedImports: ['useRequiredUserId'],
                },
                '%auth-hooks/useSession': {
                  path: useSessionImport,
                  allowedImports: ['useSession'],
                },
              }),
            },
          },
          build: async (builder) => {
            await builder.apply(
              typescript.createCopyAction({
                source: 'hooks/useCurrentUser.ts',
                destination: useCurrentUserPath,
                replacements: {
                  USER_QUERY: userQueryName,
                },
                importMappers: [reactApollo],
              }),
            );

            await builder.apply(
              copyFileAction({
                source: 'hooks/useCurrentUser.gql',
                destination: `${hookFolder}/useCurrentUser.gql`,
                replacements: {
                  CURRENT_USER_FIELDS: currentUserFields.join('\n'),
                  USER_QUERY: userQueryName,
                },
              }),
            );
            reactApollo.registerGqlFile(`${hookFolder}/useCurrentUser.gql`);

            await builder.apply(
              typescript.createCopyAction({
                source: 'hooks/useLogOut.ts',
                destination: useLogOutPath,
                importMappers: [reactError],
              }),
            );

            await builder.apply(
              typescript.createCopyAction({
                source: 'hooks/useSession.ts',
                destination: useSessionPath,
              }),
            );

            await builder.apply(
              typescript.createCopyAction({
                source: 'hooks/useRequiredUserId.ts',
                destination: useRequiredUserIdPath,
              }),
            );
          },
        };
      },
    }),
  }),
});
