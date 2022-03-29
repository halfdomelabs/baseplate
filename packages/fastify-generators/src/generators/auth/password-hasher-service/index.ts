import {
  copyTypescriptFileAction,
  ImportMapper,
  nodeProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import * as yup from 'yup';
import { appModuleProvider } from '@src/generators/core/root-module';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
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
      argon2: '^0.28.3',
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
