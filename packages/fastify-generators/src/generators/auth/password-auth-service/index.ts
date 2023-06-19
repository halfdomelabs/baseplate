import {
  ImportMapper,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service/index.js';
import { appModuleProvider } from '@src/generators/core/root-module/index.js';
import { prismaOutputProvider } from '@src/generators/prisma/prisma/index.js';
import { authProvider } from '../auth/index.js';
import { authServiceImportProvider } from '../auth-service/index.js';
import { passwordHasherServiceProvider } from '../password-hasher-service/index.js';

const descriptorSchema = z.object({});

/**
 * Expects
 *
 * userModel:
 *
 * passwordHash?: string field
 */

export type PasswordAuthServiceProvider = ImportMapper;

export const passwordAuthServiceProvider =
  createProviderType<PasswordAuthServiceProvider>('password-auth-service', {
    isReadOnly: true,
  });

const PasswordAuthServiceGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    appModule: appModuleProvider,
    passwordHasherService: passwordHasherServiceProvider,
    prismaOutput: prismaOutputProvider,
    authServiceImport: authServiceImportProvider,
    auth: authProvider,
    typescript: typescriptProvider,
    errorHandlerService: errorHandlerServiceProvider,
  },
  exports: {
    passwordAuthService: passwordAuthServiceProvider,
  },
  createGenerator(
    descriptor,
    {
      appModule,
      passwordHasherService,
      prismaOutput,
      authServiceImport,
      auth,
      typescript,
      errorHandlerService,
    }
  ) {
    const moduleFolder = appModule.getModuleFolder();
    const { userModelName } = auth.getConfig();
    if (!userModelName) {
      throw new Error('userModelName is required');
    }
    const userModel = prismaOutput.getPrismaModelExpression(userModelName);

    const passwordAuthServiceFile = typescript.createTemplate(
      {
        USER_MODEL: { type: 'code-expression' },
      },
      {
        importMappers: [
          passwordHasherService,
          authServiceImport,
          errorHandlerService,
        ],
      }
    );

    passwordAuthServiceFile.addCodeEntries({
      USER_MODEL: userModel,
    });

    return {
      getProviders: () => ({
        passwordAuthService: {
          getImportMap: () => ({
            '%password-auth-service': {
              path: `@/${moduleFolder}/services/password-auth-service`,
              allowedImports: ['passwordAuthService'],
            },
          }),
        },
      }),
      build: async (builder) => {
        builder.setBaseDirectory(moduleFolder);
        await builder.apply(
          passwordAuthServiceFile.renderToAction(
            'services/password-auth-service.ts'
          )
        );
      },
    };
  },
});

export default PasswordAuthServiceGenerator;
