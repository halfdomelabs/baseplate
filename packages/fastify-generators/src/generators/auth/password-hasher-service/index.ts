import {
  copyTypescriptFileAction,
  ImportMapper,
  nodeProvider,
} from '@halfdomelabs/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { appModuleProvider } from '@src/generators/core/root-module/index.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export type PasswordHasherServiceProvider = ImportMapper;

export const passwordHasherServiceProvider =
  createProviderType<PasswordHasherServiceProvider>('password-hasher-service');

const PasswordHasherServiceGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    node: nodeProvider,
    appModule: appModuleProvider,
  },
  exports: {
    passwordHasherService: passwordHasherServiceProvider,
  },
  createGenerator(descriptor, { node, appModule }) {
    const moduleFolder = appModule.getModuleFolder();

    node.addPackages({
      argon2: '0.28.7',
    });
    // add node-gyp to allow support for compliation on M1
    node.addDevPackages({
      'node-gyp': '9.1.0',
    });
    return {
      getProviders: () => ({
        passwordHasherService: {
          getImportMap: () => ({
            '%password-hasher-service': {
              path: `@/${moduleFolder}/services/hasher-service`,
              allowedImports: ['hasherService'],
            },
          }),
        },
      }),
      build: async (builder) => {
        builder.setBaseDirectory(moduleFolder);
        await builder.apply(
          copyTypescriptFileAction({
            source: 'services/hasher-service.ts',
          }),
        );
      },
    };
  },
});

export default PasswordHasherServiceGenerator;
