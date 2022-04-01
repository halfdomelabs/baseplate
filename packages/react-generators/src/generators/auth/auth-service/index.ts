import {
  ImportMapper,
  makeImportAndFilePath,
  tsUtilsProvider,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  copyFileAction,
} from '@baseplate/sync';
import * as yup from 'yup';
import { reactApolloSetupProvider } from '../../apollo/react-apollo';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

export type AuthServiceProvider = ImportMapper;

export const authServiceProvider =
  createProviderType<AuthServiceProvider>('auth-service');

const AuthServiceGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    tsUtils: tsUtilsProvider,
    reactApolloSetup: reactApolloSetupProvider,
    typescript: typescriptProvider,
  },
  exports: {
    authService: authServiceProvider,
  },
  createGenerator(descriptor, { tsUtils, reactApolloSetup, typescript }) {
    const authFolder = 'src/services/auth';
    const [serviceImport, servicePath] = makeImportAndFilePath(
      `${authFolder}/index.ts`
    );

    const tokensFile = typescript.createTemplate(
      {
        API_ENDPOINT_URI: { type: 'code-expression' },
      },
      {
        importMappers: [reactApolloSetup],
      }
    );
    tokensFile.addCodeEntries({
      API_ENDPOINT_URI: reactApolloSetup.getApiEndpointExpression(),
    });
    reactApolloSetup.registerGqlFile(`${authFolder}/tokens.gql`);

    const [, tokensPath] = makeImportAndFilePath(`${authFolder}/tokens.ts`);
    const [, typesPath] = makeImportAndFilePath(`${authFolder}/types.ts`);

    return {
      getProviders: () => ({
        authService: {
          getImportMap: () => ({
            '%auth-service': {
              path: serviceImport,
              allowedImports: ['authService'],
            },
          }),
        },
      }),
      build: async (builder) => {
        await builder.apply(
          typescript.createCopyAction({
            source: 'index.ts',
            destination: servicePath,
            importMappers: [tsUtils],
          })
        );

        await builder.apply(tokensFile.renderToAction('tokens.ts', tokensPath));

        await builder.apply(
          typescript.createCopyAction({
            source: 'types.ts',
            destination: typesPath,
          })
        );

        await builder.apply(
          copyFileAction({
            source: 'tokens.gql',
            destination: `${authFolder}/tokens.gql`,
            shouldFormat: true,
          })
        );
      },
    };
  },
});

export default AuthServiceGenerator;
