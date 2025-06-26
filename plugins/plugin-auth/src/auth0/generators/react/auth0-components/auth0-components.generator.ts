import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  reactComponentsImportsProvider,
  reactComponentsProvider,
} from '@baseplate-dev/react-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { AUTH0_AUTH0_COMPONENTS_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

export const auth0ComponentsGenerator = createGenerator({
  name: 'auth0/auth0-components',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: AUTH0_AUTH0_COMPONENTS_GENERATED.paths.task,
    imports: AUTH0_AUTH0_COMPONENTS_GENERATED.imports.task,
    main: createGeneratorTask({
      dependencies: {
        reactComponents: reactComponentsProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        typescriptFile: typescriptFileProvider,
        paths: AUTH0_AUTH0_COMPONENTS_GENERATED.paths.provider,
      },
      run({ reactComponents, typescriptFile, reactComponentsImports, paths }) {
        reactComponents.registerComponent({
          name: 'require-auth',
          isBarrelExport: true,
        });

        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  AUTH0_AUTH0_COMPONENTS_GENERATED.templates.requireAuth,
                destination: paths.requireAuth,
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
