import {
  makeImportAndFilePath,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  copyFileAction,
  createGeneratorWithChildren,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { authHooksProvider } from '@src/generators/auth/auth-hooks/index.js';
import { reactApolloProvider } from '../../apollo/react-apollo/index.js';

const descriptorSchema = z.object({
  userQueryName: z.string().default('user'),
});

const Auth0HooksGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    typescript: typescriptProvider,
    reactApollo: reactApolloProvider,
  },
  exports: {
    authHooks: authHooksProvider,
  },
  createGenerator({ userQueryName }, { typescript, reactApollo }) {
    const currentUserFields: string[] = [];

    const hookFolder = 'src/hooks';
    const [useCurrentUserImport, useCurrentUserPath] = makeImportAndFilePath(
      `${hookFolder}/useCurrentUser.ts`
    );
    const [useLogOutImport, useLogOutPath] = makeImportAndFilePath(
      `${hookFolder}/useLogOut.ts`
    );
    const [useSessionImport, useSessionPath] = makeImportAndFilePath(
      `${hookFolder}/useSession.ts`
    );
    const [useRequiredUserIdImport, useRequiredUserIdPath] =
      makeImportAndFilePath(`${hookFolder}/useRequiredUserId.ts`);

    return {
      getProviders: () => ({
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
      }),
      build: async (builder) => {
        await builder.apply(
          typescript.createCopyAction({
            source: 'hooks/useCurrentUser.ts',
            destination: useCurrentUserPath,
            replacements: {
              USER_QUERY: userQueryName,
            },
            importMappers: [reactApollo],
          })
        );

        await builder.apply(
          copyFileAction({
            source: 'hooks/useCurrentUser.gql',
            destination: `${hookFolder}/useCurrentUser.gql`,
            shouldFormat: true,
            replacements: {
              CURRENT_USER_FIELDS: currentUserFields.join('\n'),
              USER_QUERY: userQueryName,
            },
          })
        );
        reactApollo.registerGqlFile(`${hookFolder}/useCurrentUser.gql`);

        await builder.apply(
          typescript.createCopyAction({
            source: 'hooks/useLogOut.ts',
            destination: useLogOutPath,
          })
        );

        await builder.apply(
          typescript.createCopyAction({
            source: 'hooks/useSession.ts',
            destination: useSessionPath,
          })
        );

        await builder.apply(
          typescript.createCopyAction({
            source: 'hooks/useRequiredUserId.ts',
            destination: useRequiredUserIdPath,
          })
        );
      },
    };
  },
});

export default Auth0HooksGenerator;
