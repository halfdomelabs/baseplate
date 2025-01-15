import type { ImportMapper } from '@halfdomelabs/core-generators';

import {
  makeImportAndFilePath,
  nodeProvider,
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
  createProviderType,
} from '@halfdomelabs/sync';
import { capitalize } from 'inflection';
import { z } from 'zod';

const descriptorSchema = z.object({
  fileModelName: z.string().min(1),
});

export type UploadComponentsProvider = ImportMapper;

export const uploadComponentsProvider =
  createProviderType<UploadComponentsProvider>('upload-components');

export const uploadComponentsGenerator = createGenerator({
  name: 'react/upload-components',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder, { fileModelName }) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        node: nodeProvider,
        reactError: reactErrorProvider,
        typescript: typescriptProvider,
        reactComponents: reactComponentsProvider,
        reactApollo: reactApolloProvider,
      },
      exports: {
        uploadComponents: uploadComponentsProvider.export(projectScope),
      },
      run({ node, reactError, typescript, reactComponents, reactApollo }) {
        node.addPackages({
          axios: '1.7.4',
          'react-dropzone': '14.2.3',
          'react-circular-progressbar': '2.1.0',
        });

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
              }),
            );

            await builder.apply(
              copyFileAction({
                source: 'components/FileInput/upload.gql',
                destination: gqlFilePath,
                shouldFormat: true,
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
    });
  },
});
