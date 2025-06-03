import {
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import path from 'node:path';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';
import { appModuleProvider } from '#src/generators/core/app-module/app-module.generator.js';

import {
  createPasswordHasherServiceImports,
  passwordHasherServiceImportsProvider,
} from './generated/ts-import-maps.js';
import { AUTH_PASSWORD_HASHER_SERVICE_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

export const passwordHasherServiceGenerator = createGenerator({
  name: 'auth/password-hasher-service',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, ['@node-rs/argon2']),
    }),
    main: createGeneratorTask({
      dependencies: {
        appModule: appModuleProvider,
        typescriptFile: typescriptFileProvider,
      },
      exports: {
        passwordHasherServiceImports:
          passwordHasherServiceImportsProvider.export(projectScope),
      },
      run({ appModule, typescriptFile }) {
        const moduleFolder = appModule.getModuleFolder();

        const servicePath = path.posix.join(
          moduleFolder,
          'services/password-hasher.service.ts',
        );

        return {
          providers: {
            passwordHasherServiceImports: createPasswordHasherServiceImports(
              path.posix.join(moduleFolder, 'services'),
            ),
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  AUTH_PASSWORD_HASHER_SERVICE_TS_TEMPLATES.passwordHasherService,
                destination: servicePath,
              }),
            );
          },
        };
      },
    }),
  }),
});

export { passwordHasherServiceImportsProvider } from './generated/ts-import-maps.js';
