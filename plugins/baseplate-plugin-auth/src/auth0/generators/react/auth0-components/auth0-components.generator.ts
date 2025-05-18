import {
  projectScope,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  authComponentsImportsProvider,
  reactComponentsImportsProvider,
  reactComponentsProvider,
} from '@halfdomelabs/react-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import path from 'node:path';
import { z } from 'zod';

import { createAuth0ComponentsImports } from './generated/ts-import-maps.js';
import { AUTH_0_AUTH_0_COMPONENTS_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

export const auth0ComponentsGenerator = createGenerator({
  name: 'auth0/auth0-components',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        reactComponents: reactComponentsProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        typescriptFile: typescriptFileProvider,
      },
      exports: {
        authComponentsImports:
          authComponentsImportsProvider.export(projectScope),
      },
      run({ reactComponents, typescriptFile, reactComponentsImports }) {
        const requireAuthPath = `${reactComponents.getComponentsFolder()}/RequireAuth/index.tsx`;
        reactComponents.registerComponent({ name: 'RequireAuth' });

        return {
          providers: {
            authComponentsImports: createAuth0ComponentsImports(
              path.dirname(requireAuthPath),
            ),
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: AUTH_0_AUTH_0_COMPONENTS_TS_TEMPLATES.requireAuth,
                destination: requireAuthPath,
                importMapProviders: {
                  reactComponentsImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
