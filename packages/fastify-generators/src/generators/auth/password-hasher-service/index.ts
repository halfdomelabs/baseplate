import {
  copyTypescriptFileAction,
  ImportMapper,
  nodeProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import { z } from 'zod';
import { appModuleProvider } from '@src/generators/core/root-module';

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
          })
        );
      },
    };
  },
});

export default PasswordHasherServiceGenerator;
