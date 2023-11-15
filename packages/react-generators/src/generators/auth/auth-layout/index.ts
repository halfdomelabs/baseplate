import {
  makeImportAndFilePath,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { reactComponentsProvider } from '@src/generators/core/react-components/index.js';
import { reactRoutesProvider } from '@src/providers/routes.js';
import { writeReactComponent } from '@src/writers/component/index.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
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
      `${reactRoutes.getDirectoryBase()}/components/AuthLayout/index.tsx`,
    );

    const layoutExpression = TypescriptCodeUtils.createExpression(
      `<${name} />`,
      `import ${name} from '${layoutImport}';`,
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
          `import { Outlet } from 'react-router-dom'`,
        );

        const component = writeReactComponent({ name, body });

        await builder.apply(
          typescript.renderBlockToAction(component, layoutPath),
        );
      },
    };
  },
});

export default AuthLayoutGenerator;
