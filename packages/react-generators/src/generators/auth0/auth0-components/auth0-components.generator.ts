import {
  makeImportAndFilePath,
  projectScope,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { authComponentsProvider } from '@src/generators/auth/_providers/auth-components.js';
import { reactComponentsProvider } from '@src/generators/core/react-components/react-components.generator.js';

const descriptorSchema = z.object({});

export const auth0ComponentsGenerator = createGenerator({
  name: 'auth0/auth0-components',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        reactComponents: reactComponentsProvider,
        typescript: typescriptProvider,
      },
      exports: {
        authComponents: authComponentsProvider.export(projectScope),
      },
      run({ reactComponents, typescript }) {
        const [, requireAuthPath] = makeImportAndFilePath(
          `${reactComponents.getComponentsFolder()}/RequireAuth/index.tsx`,
        );
        reactComponents.registerComponent({ name: 'RequireAuth' });

        return {
          providers: {
            authComponents: {
              getImportMap: () => ({
                '%auth-components': {
                  path: reactComponents.getComponentsImport(),
                  allowedImports: ['RequireAuth'],
                },
              }),
            },
          },
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
    }),
  }),
});
