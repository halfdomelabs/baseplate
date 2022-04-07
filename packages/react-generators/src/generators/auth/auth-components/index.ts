import {
  ImportMapper,
  makeImportAndFilePath,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import * as yup from 'yup';
import { reactComponentsProvider } from '@src/generators/core/react-components';
import { authHooksProvider } from '../auth-hooks';

const descriptorSchema = yup.object({
  loginPath: yup.string().required(),
});

export type AuthComponentsProvider = ImportMapper;

export const authComponentsProvider =
  createProviderType<AuthComponentsProvider>('auth-components');

const AuthComponentsGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    authHooks: authHooksProvider,
    reactComponents: reactComponentsProvider,
    typescript: typescriptProvider,
  },
  exports: {
    authComponents: authComponentsProvider,
  },
  createGenerator({ loginPath }, { authHooks, reactComponents, typescript }) {
    const [, requireAuthPath] = makeImportAndFilePath(
      `${reactComponents.getComponentsFolder()}/RequireAuth/index.tsx`
    );
    reactComponents.registerComponent({ name: 'RequireAuth' });

    return {
      getProviders: () => ({
        authComponents: {
          getImportMap: () => ({
            '%auth-components': {
              path: reactComponents.getComponentsImport(),
              allowedImports: ['RequireAuth'],
            },
          }),
        },
      }),
      build: async (builder) => {
        await builder.apply(
          typescript.createCopyAction({
            source: 'RequireAuth.tsx',
            destination: requireAuthPath,
            importMappers: [authHooks],
            replacements: {
              LOGIN_PATH: loginPath,
            },
          })
        );
      },
    };
  },
});

export default AuthComponentsGenerator;
