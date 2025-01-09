import {
  makeImportAndFilePath,
  projectScope,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { z } from 'zod';

import { authComponentsProvider } from '@src/generators/auth/auth-components/index.js';
import { reactComponentsProvider } from '@src/generators/core/react-components/index.js';

const descriptorSchema = z.object({});

const Auth0ComponentsGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    reactComponents: reactComponentsProvider,
    typescript: typescriptProvider,
  },
  exports: {
    authComponents: authComponentsProvider.export(projectScope),
  },
  createGenerator(descriptor, { reactComponents, typescript }) {
    const [, requireAuthPath] = makeImportAndFilePath(
      `${reactComponents.getComponentsFolder()}/RequireAuth/index.tsx`,
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
          }),
        );
      },
    };
  },
});

export default Auth0ComponentsGenerator;
