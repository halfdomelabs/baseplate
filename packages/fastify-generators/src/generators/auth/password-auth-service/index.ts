import { ImportMapper, typescriptProvider } from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import * as yup from 'yup';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service';
import { appModuleProvider } from '@src/generators/core/root-module';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';
import { authProvider } from '../auth';
import { authServiceProvider } from '../auth-service';
import { passwordHasherServiceProvider } from '../password-hasher-service';

const descriptorSchema = yup.object({});

/**
 * Expects
 *
 * userModel:
 *
 * passwordHash?: string field
 */

export type PasswordAuthServiceProvider = ImportMapper;

export const passwordAuthServiceProvider =
  createProviderType<PasswordAuthServiceProvider>('password-auth-service');

const PasswordAuthServiceGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    appModule: appModuleProvider,
    passwordHasherService: passwordHasherServiceProvider,
    prismaOutput: prismaOutputProvider,
    authService: authServiceProvider,
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
      authService,
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
          authService,
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
