import type { ImportMapper } from '@halfdomelabs/core-generators';

import {
  makeImportAndFilePath,
  nodeProvider,
  projectScope,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
} from '@halfdomelabs/sync';
import path from 'node:path';
import { z } from 'zod';

import { appModuleProvider } from '@src/generators/core/root-module/index.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export type PasswordHasherServiceProvider = ImportMapper;

export const passwordHasherServiceProvider =
  createProviderType<PasswordHasherServiceProvider>('password-hasher-service');

const PasswordHasherServiceGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
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

        const [fileImport] = makeImportAndFilePath(
          path.join(moduleFolder, 'services/password-hasher.service.ts'),
        );

        node.addPackages({
          '@node-rs/argon2': '2.0.2',
        });

        return {
          getProviders: () => ({
            passwordHasherService: {
              getImportMap: () => ({
                '%password-hasher-service': {
                  path: fileImport,
                  allowedImports: ['createPasswordHash', 'verifyPasswordHash'],
                },
              }),
            },
          }),
          build: async (builder) => {
            builder.setBaseDirectory(moduleFolder);
            await builder.apply(
              typescript.createCopyAction({
                source: 'services/password-hasher.service.ts',
              }),
            );
          },
        };
      },
    });
  },
});

export default PasswordHasherServiceGenerator;
