import {
  makeImportAndFilePath,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
} from '@baseplate/sync';
import * as yup from 'yup';
import { authHooksProvider } from '@src/generators/auth/auth-hooks';
import { reactComponentsProvider } from '@src/generators/core/react-components';
import { reactRoutesProvider } from '@src/providers/routes';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

export type AdminHomeProvider = unknown;

export const adminHomeProvider =
  createProviderType<AdminHomeProvider>('admin-home');

const AdminHomeGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    reactComponents: reactComponentsProvider,
    authHooks: authHooksProvider,
    typescript: typescriptProvider,
    reactRoutes: reactRoutesProvider,
  },
  exports: {
    adminHome: adminHomeProvider,
  },
  createGenerator(
    descriptor,
    { authHooks, reactComponents, reactRoutes, typescript }
  ) {
    const [pageImport, pagePath] = makeImportAndFilePath(
      `${reactRoutes.getDirectoryBase()}/Home/index.tsx`
    );
    reactRoutes.registerRoute({
      index: true,
      element: TypescriptCodeUtils.createExpression(
        `<Home />`,
        `import Home from '${pageImport}';`
      ),
      layoutKey: 'admin',
    });

    return {
      getProviders: () => ({
        adminHome: {},
      }),
      build: async (builder) => {
        await builder.apply(
          typescript.createCopyAction({
            source: 'Home.page.tsx',
            destination: pagePath,
            importMappers: [authHooks, reactComponents],
          })
        );
      },
    };
  },
});

export default AdminHomeGenerator;
