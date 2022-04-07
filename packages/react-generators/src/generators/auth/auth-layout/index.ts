import {
  makeImportAndFilePath,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import * as yup from 'yup';
import { reactComponentsProvider } from '@src/generators/core/react-components';
import { reactRoutesProvider } from '@src/providers/routes';
import { writeReactComponent } from '@src/writers/component';

const descriptorSchema = yup.object({
  name: yup.string().required(),
});

export type AuthLayoutProvider = unknown;

export const authLayoutProvider =
  createProviderType<AuthLayoutProvider>('auth-layout');

const AuthLayoutGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    reactComponents: reactComponentsProvider,
    reactRoutes: reactRoutesProvider,
    typescript: typescriptProvider,
  },
  exports: {
    authLayout: authLayoutProvider,
  },
  createGenerator({ name }, { reactRoutes, typescript }) {
    const [layoutImport, layoutPath] = makeImportAndFilePath(
      `${reactRoutes.getDirectoryBase()}/components/AuthLayout/index.tsx`
    );

    const layoutExpression = TypescriptCodeUtils.createExpression(
      `<${name} />`,
      `import ${name} from '${layoutImport}';`
    );

    reactRoutes.registerLayout({
      key: 'auth',
      element: layoutExpression,
    });

    return {
      getProviders: () => ({
        authLayout: {},
      }),
      build: async (builder) => {
        const body = TypescriptCodeUtils.createBlock(
          `return <div className="min-h-full flex items-center justify-center bg-slate-100"><Outlet /></div>;`,
          `import { Outlet } from 'react-router-dom'`
        );

        const component = writeReactComponent({ name, body });

        await builder.apply(
          typescript.renderBlockToAction(component, layoutPath)
        );
      },
    };
  },
});

export default AuthLayoutGenerator;
