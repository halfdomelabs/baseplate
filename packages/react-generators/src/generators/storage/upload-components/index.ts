import {
  ImportMapper,
  makeImportAndFilePath,
  nodeProvider,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  copyFileAction,
} from '@halfdomelabs/sync';
import { capitalize } from 'inflection';
import { z } from 'zod';
import { reactApolloProvider } from '@src/generators/apollo/react-apollo/index.js';
import { reactComponentsProvider } from '@src/generators/core/react-components/index.js';
import { reactErrorProvider } from '@src/generators/core/react-error/index.js';

const descriptorSchema = z.object({
  fileModelName: z.string().min(1),
});

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
    { fileModelName },
    { node, reactError, typescript, reactComponents, reactApollo }
  ) {
    node.addPackages({
      axios: '1.4.0',
      'react-dropzone': '14.2.3',
      'react-circular-progressbar': '2.1.0',
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
            replacements: {
              FILE_SCHEMA: capitalize(fileModelName),
            },
          })
        );

        await builder.apply(
          typescript.createCopyAction({
            source: 'hooks/useUpload.ts',
            destination: hookPath,
          })
        );
      },
    };
  },
});

export default UploadComponentsGenerator;
