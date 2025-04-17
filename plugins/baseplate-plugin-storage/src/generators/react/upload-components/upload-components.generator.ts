import type { ImportMapper } from '@halfdomelabs/core-generators';

import {
  CORE_PACKAGES,
  createNodePackagesTask,
  makeImportAndFilePath,
  projectScope,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  reactApolloProvider,
  reactComponentsProvider,
  reactErrorProvider,
} from '@halfdomelabs/react-generators';
import {
  copyFileAction,
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { capitalize } from 'inflection';
import { z } from 'zod';

import { STORAGE_PACKAGES } from '@src/constants';

const descriptorSchema = z.object({
  fileModelName: z.string().min(1),
});

type UploadComponentsProvider = ImportMapper;

export const uploadComponentsProvider =
  createProviderType<UploadComponentsProvider>('upload-components');

export const uploadComponentsGenerator = createGenerator({
  name: 'react/upload-components',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ fileModelName }) => ({
    nodePackages: createNodePackagesTask({
      prod: {
        axios: CORE_PACKAGES.axios,
        'react-dropzone': STORAGE_PACKAGES['react-dropzone'],
        'react-circular-progressbar':
          STORAGE_PACKAGES['react-circular-progressbar'],
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        reactError: reactErrorProvider,
        typescript: typescriptProvider,
        reactComponents: reactComponentsProvider,
        reactApollo: reactApolloProvider,
      },
      exports: {
        uploadComponents: uploadComponentsProvider.export(projectScope),
      },
      run({ reactError, typescript, reactComponents, reactApollo }) {
        reactComponents.registerComponent({
          name: 'FileInput',
        });

        const [hookImport, hookPath] = makeImportAndFilePath(
          `src/hooks/useUpload.ts`,
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
          providers: {
            uploadComponents: {
              getImportMap() {
                return importMap;
              },
            },
          },
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
              }),
            );

            await builder.apply(
              copyFileAction({
                source: 'components/FileInput/upload.gql',
                destination: gqlFilePath,
                replacements: {
                  FILE_SCHEMA: capitalize(fileModelName),
                },
              }),
            );

            await builder.apply(
              typescript.createCopyAction({
                source: 'hooks/useUpload.ts',
                destination: hookPath,
              }),
            );
          },
        };
      },
    }),
  }),
});
