import type { ImportMapper } from '@halfdomelabs/core-generators';

import {
  makeImportAndFilePath,
  nodeProvider,
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
import { appModuleProvider } from '@src/generators/core/root-module/index.js';

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
  buildTasks: () => [
    createGeneratorTask({
      name: 'main',
      dependencies: {
        node: nodeProvider,
        appModule: appModuleProvider,
        typescript: typescriptProvider,
      },
      exports: {
        passwordHasherService:
          passwordHasherServiceProvider.export(projectScope),
      },
      run({ node, appModule, typescript }) {
        const moduleFolder = appModule.getModuleFolder();

        const [fileImport, filePath] = makeImportAndFilePath(
          path.join(moduleFolder, 'services/password-hasher.service.ts'),
        );

        node.addPackages({
          '@node-rs/argon2': FASTIFY_PACKAGES['@node-rs/argon2'],
        });

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
  ],
});
