import {
  makeImportAndFilePath,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import * as yup from 'yup';
import { reactComponentsProvider } from '@src/generators/core/react-components';
import { reactPagesProvider } from '@src/providers/pages';
import { authHooksProvider } from '../auth-hooks';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

export interface AuthLayoutsSetupProvider {
  setAuthenticatedLayout(layout: TypescriptCodeExpression): void;
  setUnauthenticatedLayout(layout: TypescriptCodeExpression): void;
}

export const authLayoutsSetupProvider =
  createProviderType<AuthLayoutsSetupProvider>('auth-layouts-setup');

export type AuthLayoutsProvider = unknown;

export const authLayoutsProvider =
  createProviderType<AuthLayoutsProvider>('auth-layouts');

const AuthLayoutsGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({
    authenticated: {
      defaultDescriptor: {
        name: 'AuthenticatedLayout',
        generator: '@baseplate/react/auth/auth-layout',
        isAuthenticated: true,
      },
    },
    unauthenticated: {
      defaultDescriptor: {
        name: 'UnauthenticatedLayout',
        generator: '@baseplate/react/auth/auth-layout',
        isAuthenticated: false,
      },
    },
  }),
  dependencies: {
    reactPages: reactPagesProvider,
    typescript: typescriptProvider,
    reactComponents: reactComponentsProvider,
    authHooks: authHooksProvider,
  },
  exports: {
    authLayoutsSetup: authLayoutsSetupProvider,
    authLayouts: authLayoutsProvider
      .export()
      .dependsOn(authLayoutsSetupProvider),
  },
  createGenerator(
    descriptor,
    { reactPages, reactComponents, typescript, authHooks }
  ) {
    let authenticatedLayout: TypescriptCodeExpression | undefined;
    let unauthenticatedLayout: TypescriptCodeExpression | undefined;

    const [authGateImport, authGatePath] = makeImportAndFilePath(
      `${reactComponents.getComponentsFolder()}/AuthGate/index.tsx`
    );
    reactComponents.registerComponent({ name: 'AuthGate' });

    return {
      getProviders: () => ({
        authLayoutsSetup: {
          setAuthenticatedLayout(layout: TypescriptCodeExpression) {
            authenticatedLayout = layout;
          },
          setUnauthenticatedLayout(layout: TypescriptCodeExpression) {
            unauthenticatedLayout = layout;
          },
        },
        authLayouts: {},
      }),
      build: async (builder) => {
        if (!authenticatedLayout || !unauthenticatedLayout) {
          throw new Error(
            'Authenticated and unauthenticated layouts must be set before building'
          );
        }
        reactPages.registerLayout({
          key: 'unauthenticated',
          element: unauthenticatedLayout,
        });

        const authGateWrapper = TypescriptCodeUtils.createWrapper(
          (contents) => `<AuthGate>${contents}</AuthGate>`,
          `import { AuthGate } from '${authGateImport}';`
        );
        reactPages.registerLayout({
          key: 'authenticated',
          element: TypescriptCodeUtils.wrapExpression(
            authenticatedLayout,
            authGateWrapper
          ),
        });

        reactPages.registerLayout({
          key: 'authenticated-or-unauthenticated',
          element: TypescriptCodeUtils.formatExpression(
            `isAuthenticated ? AUTHENTICATED : UNAUTHENTICATED`,
            {
              AUTHENTICATED: authenticatedLayout,
              UNAUTHENTICATED: unauthenticatedLayout,
            }
          ),
          header: TypescriptCodeUtils.createBlock(
            `const { isAuthenticated } = useSession();`,
            `import { useSession } from '%auth-hooks/useSession'`,
            { importMappers: [authHooks] }
          ),
        });

        await builder.apply(
          typescript.createCopyAction({
            source: 'AuthGate.tsx',
            destination: authGatePath,
            importMappers: [authHooks],
          })
        );
      },
    };
  },
});

export default AuthLayoutsGenerator;
