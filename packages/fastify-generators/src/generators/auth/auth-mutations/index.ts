import {
  TypescriptCodeExpression,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import * as yup from 'yup';
import { appModuleProvider } from '@src/generators/core/root-module';
import { nexusSchemaProvider } from '@src/generators/nexus/nexus';
import { authServiceProvider } from '../auth-service';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

export type AuthMutationsProvider = unknown;

export const authMutationsProvider =
  createProviderType<AuthMutationsProvider>('auth-mutations');

const AuthMutationsGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    appModule: appModuleProvider,
    nexusSchema: nexusSchemaProvider,
    authService: authServiceProvider,
    typescript: typescriptProvider,
  },
  exports: {
    authMutations: authMutationsProvider,
  },
  createGenerator(
    descriptor,
    { appModule, nexusSchema, authService, typescript }
  ) {
    const appModuleFolder = appModule.getModuleFolder();

    const authMutationsFile = typescript.createTemplate({
      STANDARD_MUTATION: { type: 'code-expression' },
      AUTH_SERVICE: { type: 'code-expression' },
    });

    authMutationsFile.addCodeEntries({
      STANDARD_MUTATION: nexusSchema.getUtilsExpression('STANDARD_MUTATION'),
      AUTH_SERVICE: authService.getServiceExpression(),
    });

    nexusSchema.registerSchemaFile(
      `${appModuleFolder}/schema/auth-mutations.ts`
    );
    appModule.registerFieldEntry(
      'schemaTypes',
      new TypescriptCodeExpression(
        'authMutations',
        `import * as authMutations from '@/${appModuleFolder}/schema/auth-mutations'`
      )
    );

    return {
      getProviders: () => ({
        authMutations: {},
      }),
      build: async (builder) => {
        builder.setBaseDirectory(appModule.getModuleFolder());

        await builder.apply(
          authMutationsFile.renderToAction('schema/auth-mutations.ts')
        );
      },
    };
  },
});

export default AuthMutationsGenerator;
