import {
  ImportMapper,
  makeImportAndFilePath,
  nodeProvider,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  copyFileAction,
} from '@baseplate/sync';
import { z } from 'zod';
import { reactApolloProvider } from '../../apollo/react-apollo';
import { reactComponentsProvider } from '../../core/react-components';
import { reactErrorProvider } from '../../core/react-error';
import { reactLoggerProvider } from '../../core/react-logger';
import { authServiceProvider } from '../auth-service';

const descriptorSchema = z.object({
  userQueryName: z.string().default('user'),
});

export interface AuthHooksProvider extends ImportMapper {
  addCurrentUserField: (field: string) => void;
}

export const authHooksProvider =
  createProviderType<AuthHooksProvider>('auth-hooks');

const AuthHooksGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    typescript: typescriptProvider,
    reactComponents: reactComponentsProvider,
    reactApollo: reactApolloProvider,
    authService: authServiceProvider,
    reactLogger: reactLoggerProvider,
    reactError: reactErrorProvider,
    node: nodeProvider,
  },
  exports: {
    authHooks: authHooksProvider,
  },
  createGenerator(
    { userQueryName },
    {
      typescript,
      reactComponents,
      reactApollo,
      authService,
      reactLogger,
      reactError,
      node,
    }
  ) {
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

    node.addPackages({
      'use-subscription': '^1.5.1',
    });
    node.addDevPackages({
      '@types/use-subscription': '^1.0.0',
    });

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
            importMappers: [
              reactApollo,
              reactComponents,
              authService,
              reactLogger,
              reactError,
            ],
          })
        );

        await builder.apply(
          copyFileAction({
            source: 'hooks/useLogOut.gql',
            destination: `${hookFolder}/useLogOut.gql`,
            shouldFormat: true,
          })
        );
        reactApollo.registerGqlFile(`${hookFolder}/useLogOut.gql`);

        await builder.apply(
          typescript.createCopyAction({
            source: 'hooks/useSession.ts',
            destination: useSessionPath,
            importMappers: [authService],
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

export default AuthHooksGenerator;
