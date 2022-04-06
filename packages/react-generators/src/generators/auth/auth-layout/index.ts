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
import { writeReactComponent } from '@src/writers/component';
import { authLayoutsSetupProvider } from '../auth-layouts';

const descriptorSchema = yup.object({
  name: yup.string().required(),
  isAuthenticated: yup.boolean().required(),
});

export type AuthLayoutProvider = unknown;

export const authLayoutProvider =
  createProviderType<AuthLayoutProvider>('auth-layout');

const AuthLayoutGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    authLayoutsSetup: authLayoutsSetupProvider,
    reactComponents: reactComponentsProvider,
    typescript: typescriptProvider,
  },
  exports: {
    authLayout: authLayoutProvider,
  },
  createGenerator(
    { name, isAuthenticated },
    { authLayoutsSetup, reactComponents, typescript }
  ) {
    const [layoutImport, layoutPath] = makeImportAndFilePath(
      `${reactComponents.getComponentsFolder()}/${name}/index.tsx`
    );

    const layoutExpression = TypescriptCodeUtils.createExpression(
      `<${name} />`,
      `import ${name} from '${layoutImport}';`
    );

    if (isAuthenticated) {
      authLayoutsSetup.setAuthenticatedLayout(layoutExpression);
    } else {
      authLayoutsSetup.setUnauthenticatedLayout(layoutExpression);
    }

    return {
      getProviders: () => ({
        authLayout: {},
      }),
      build: async (builder) => {
        const defaultBlock = TypescriptCodeUtils.createBlock(
          `return <Outlet />;`,
          `import { Outlet } from 'react-router-dom'`
        );

        const component = writeReactComponent({
          name,
          body: defaultBlock,
        });

        await builder.apply(
          typescript.renderBlockToAction(component, layoutPath)
        );
      },
    };
  },
});

export default AuthLayoutGenerator;
