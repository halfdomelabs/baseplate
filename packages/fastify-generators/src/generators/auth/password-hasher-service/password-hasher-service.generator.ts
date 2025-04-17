import type { ImportMapper } from '@halfdomelabs/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  makeImportAndFilePath,
  projectScope,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import path from 'node:path';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';
import { appModuleProvider } from '@src/generators/core/root-module/root-module.generator.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export type PasswordHasherServiceProvider = ImportMapper;

export const passwordHasherServiceProvider =
  createProviderType<PasswordHasherServiceProvider>('password-hasher-service');

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
        typescript: typescriptProvider,
      },
      exports: {
        passwordHasherService:
          passwordHasherServiceProvider.export(projectScope),
      },
      run({ appModule, typescript }) {
        const moduleFolder = appModule.getModuleFolder();

        const [fileImport, filePath] = makeImportAndFilePath(
          path.join(moduleFolder, 'services/password-hasher.service.ts'),
        );

        return {
          providers: {
            passwordHasherService: {
              getImportMap: () => ({
                '%password-hasher-service': {
                  path: fileImport,
                  allowedImports: ['createPasswordHash', 'verifyPasswordHash'],
                },
              }),
            },
          },
          build: async (builder) => {
            await builder.apply(
              typescript.createCopyAction({
                source: 'services/password-hasher.service.ts',
                destination: filePath,
              }),
            );
          },
        };
      },
    }),
  }),
});
