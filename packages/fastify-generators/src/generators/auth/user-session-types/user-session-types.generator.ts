import {
  projectScope,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import path from 'node:path';
import { z } from 'zod';

import { appModuleProvider } from '#src/generators/core/app-module/app-module.generator.js';

import { authContextImportsProvider } from '../auth-context/auth-context.generator.js';
import {
  createUserSessionTypesImports,
  userSessionTypesImportsProvider,
} from './generated/ts-import-maps.js';
import { AUTH_USER_SESSION_TYPES_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

export const userSessionTypesGenerator = createGenerator({
  name: 'auth/user-session-types',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        appModule: appModuleProvider,
        typescriptFile: typescriptFileProvider,
        authContextImports: authContextImportsProvider,
      },
      exports: {
        userSessionTypesImports:
          userSessionTypesImportsProvider.export(projectScope),
      },
      run({ appModule, typescriptFile, authContextImports }) {
        const userSessionTypesFile = path.join(
          appModule.getModuleFolder(),
          'types/user-session.types.ts',
        );
        return {
          providers: {
            userSessionTypesImports: createUserSessionTypesImports(
              path.dirname(userSessionTypesFile),
            ),
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: AUTH_USER_SESSION_TYPES_TS_TEMPLATES.userSessionTypes,
                destination: userSessionTypesFile,
                importMapProviders: {
                  authContextImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});

export { userSessionTypesImportsProvider } from './generated/ts-import-maps.js';
