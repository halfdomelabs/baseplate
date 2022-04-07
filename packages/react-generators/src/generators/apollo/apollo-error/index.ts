import {
  ImportMapper,
  makeImportAndFilePath,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import * as yup from 'yup';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

export type ApolloErrorProvider = ImportMapper;

export const apolloErrorProvider =
  createProviderType<ApolloErrorProvider>('apollo-error');

const ApolloErrorGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    typescript: typescriptProvider,
  },
  exports: {
    apolloError: apolloErrorProvider,
  },
  createGenerator(descriptor, { typescript }) {
    const [utilImport, utilPath] = makeImportAndFilePath(
      'src/utils/apollo-error.ts'
    );

    return {
      getProviders: () => ({
        apolloError: {
          getImportMap: () => ({
            '%apollo-error/utils': {
              path: utilImport,
              allowedImports: ['getApolloErrorCode'],
            },
          }),
        },
      }),
      build: async (builder) => {
        await builder.apply(
          typescript.createCopyAction({
            source: 'apollo-error.ts',
            destination: utilPath,
          })
        );
      },
    };
  },
});

export default ApolloErrorGenerator;
