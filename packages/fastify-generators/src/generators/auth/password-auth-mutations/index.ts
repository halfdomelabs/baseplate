import {
  makeImportAndFilePath,
  TypescriptCodeExpression,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { z } from 'zod';
import { appModuleProvider } from '@src/generators/core/root-module/index.js';
import { nexusSchemaProvider } from '@src/generators/nexus/nexus/index.js';
import { prismaOutputProvider } from '@src/generators/prisma/prisma/index.js';
import { authProvider } from '../auth/index.js';
import { authMutationsProvider } from '../auth-mutations/index.js';
import { passwordAuthServiceProvider } from '../password-auth-service/index.js';

const descriptorSchema = z.object({});

const PasswordAuthMutationsGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    typescript: typescriptProvider,
    nexusSchema: nexusSchemaProvider,
    prismaOutput: prismaOutputProvider,
    passwordAuthService: passwordAuthServiceProvider,
    authMutations: authMutationsProvider,
    auth: authProvider,
    appModule: appModuleProvider,
  },
  createGenerator(
    descriptor,
    {
      typescript,
      nexusSchema,
      passwordAuthService,
      authMutations,
      prismaOutput,
      auth,
      appModule,
    }
  ) {
    const moduleFolder = appModule.getModuleFolder();
    const { userModelName } = auth.getConfig();
    if (!userModelName) {
      throw new Error('userModelName is required');
    }
    const userModel = prismaOutput.getPrismaModelExpression(userModelName);
    const mutationFile = typescript.createTemplate(
      {
        USER_MODEL: { type: 'code-expression' },
      },
      {
        importMappers: [nexusSchema, passwordAuthService, authMutations],
      }
    );
    const [importPath, filePath] = makeImportAndFilePath(
      `${moduleFolder}/schema/password-auth-mutations.ts`
    );

    appModule.registerFieldEntry(
      'schemaTypes',
      new TypescriptCodeExpression(
        'passwordAuthMutations',
        `import * as passwordAuthMutations from '${importPath}';`
      )
    );
    nexusSchema.registerSchemaFile(filePath);
    mutationFile.addCodeEntries({
      USER_MODEL: userModel,
    });
    return {
      build: async (builder) => {
        await builder.apply(
          mutationFile.renderToAction(
            'schema/password-auth-mutations.ts',
            filePath
          )
        );
      },
    };
  },
});

export default PasswordAuthMutationsGenerator;
