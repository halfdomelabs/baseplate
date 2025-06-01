import {
  projectScope,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { appModuleProvider } from '#src/generators/core/index.js';

import { userSessionServiceImportsProvider } from '../_providers/user-session.js';
import { userSessionTypesImportsProvider } from '../user-session-types/user-session-types.generator.js';
import { createPlaceholderAuthServiceImports } from './generated/ts-import-maps.js';
import { AUTH_PLACEHOLDER_AUTH_SERVICE_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

/**
 * Placeholder generator for auth session service.
 *
 * Useful for creating a test auth implementation.
 */
export const placeholderAuthServiceGenerator = createGenerator({
  name: 'auth/placeholder-auth-service',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        userSessionTypesImports: userSessionTypesImportsProvider,
        typescriptFile: typescriptFileProvider,
        appModule: appModuleProvider,
      },
      exports: {
        userSessionServiceImports:
          userSessionServiceImportsProvider.export(projectScope),
      },
      run({ userSessionTypesImports, typescriptFile, appModule }) {
        const userSessionServicePath = `${appModule.getModuleFolder()}/services/user-session.service.ts`;
        return {
          providers: {
            userSessionServiceImports: createPlaceholderAuthServiceImports(
              `${appModule.getModuleFolder()}/services`,
            ),
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  AUTH_PLACEHOLDER_AUTH_SERVICE_TS_TEMPLATES.userSessionService,
                destination: userSessionServicePath,
                variables: {},
                importMapProviders: {
                  userSessionTypesImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
