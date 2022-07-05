import {
  ImportMapper,
  makeImportAndFilePath,
  nodeProvider,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  copyFileAction,
} from '@baseplate/sync';
import { z } from 'zod';
import { reactApolloProvider } from '@src/generators/apollo/react-apollo';
import { reactComponentsProvider } from '@src/generators/core/react-components';
import { reactErrorProvider } from '@src/generators/core/react-error';

const descriptorSchema = z.object({});

export type UploadComponentsProvider = ImportMapper;

export const uploadComponentsProvider =
  createProviderType<UploadComponentsProvider>('upload-components');

const UploadComponentsGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    node: nodeProvider,
    reactError: reactErrorProvider,
    typescript: typescriptProvider,
    reactComponents: reactComponentsProvider,
    reactApollo: reactApolloProvider,
  },
  exports: {
    uploadComponents: uploadComponentsProvider,
  },
  createGenerator(
    descriptor,
    { node, reactError, typescript, reactComponents, reactApollo }
  ) {
    node.addPackages({
      axios: '~0.27.2',
      'react-dropzone': '~14.2.1',
    });

    reactComponents.registerComponent({
      name: 'FileInput',
    });

    const [hookImport, hookPath] = makeImportAndFilePath(
      `src/hooks/useUpload.ts`
    );

    const importMap = {
      '%upload-components/file-input': {
        path: reactComponents.getComponentsImport(),
        allowedImports: ['FileInput'],
      },
      '%upload-components/use-upload': {
        path: hookImport,
        allowedImports: ['useUpload'],
      },
    };

    const gqlFilePath = `${reactComponents.getComponentsFolder()}/FileInput/upload.gql`;
    reactApollo.registerGqlFile(gqlFilePath);

    return {
      getProviders: () => ({
        uploadComponents: {
          getImportMap() {
            return importMap;
          },
        },
      }),
      build: async (builder) => {
        await builder.apply(
          typescript.createCopyAction({
            source: 'components/FileInput/index.tsx',
            destination: `${reactComponents.getComponentsFolder()}/FileInput/index.tsx`,
            importMappers: [
              reactError,
              { getImportMap: () => importMap },
              reactApollo,
            ],
          })
        );

        await builder.apply(
          copyFileAction({
            source: 'components/FileInput/upload.gql',
            destination: gqlFilePath,
            shouldFormat: true,
          })
        );

        await builder.apply(
          typescript.createCopyAction({
            source: 'hooks/useUpload.tsx',
            destination: hookPath,
          })
        );
      },
    };
  },
});

export default UploadComponentsGenerator;
