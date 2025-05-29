import {
  CORE_PACKAGES,
  createNodePackagesTask,
  projectScope,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  generatedGraphqlImportsProvider,
  reactApolloProvider,
  reactComponentsImportsProvider,
  reactComponentsProvider,
  reactErrorImportsProvider,
} from '@halfdomelabs/react-generators';
import {
  createGenerator,
  createGeneratorTask,
  renderTextTemplateFileAction,
} from '@halfdomelabs/sync';
import { capitalize } from 'inflection';
import { z } from 'zod';

import { STORAGE_PACKAGES } from '#src/constants/index.js';

import { REACT_UPLOAD_COMPONENTS_TEXT_TEMPLATES } from './generated/text-templates.js';
import {
  createUploadComponentsImports,
  uploadComponentsImportsProvider,
} from './generated/ts-import-maps.js';
import { REACT_UPLOAD_COMPONENTS_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({
  fileModelName: z.string().min(1),
});

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
        reactErrorImports: reactErrorImportsProvider,
        typescriptFile: typescriptFileProvider,
        reactComponents: reactComponentsProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        generatedGraphqlImports: generatedGraphqlImportsProvider,
        reactApollo: reactApolloProvider,
      },
      exports: {
        uploadComponentsImports:
          uploadComponentsImportsProvider.export(projectScope),
      },
      run({
        reactErrorImports,
        typescriptFile,
        reactComponentsImports,
        generatedGraphqlImports,
        reactApollo,
        reactComponents,
      }) {
        reactComponents.registerComponent({
          name: 'FileInput',
        });

        const hookPath = '@/src/hooks/useUpload.ts';
        const fileInputComponentPath = `${reactComponents.getComponentsFolder()}/FileInput/index.tsx`;
        const gqlFilePath = `${reactComponents.getComponentsFolder()}/FileInput/upload.gql`;
        reactApollo.registerGqlFile(gqlFilePath);

        return {
          providers: {
            uploadComponentsImports: createUploadComponentsImports('@/src'),
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  REACT_UPLOAD_COMPONENTS_TS_TEMPLATES.fileInputComponent,
                destination: fileInputComponentPath,
                importMapProviders: {
                  reactErrorImports,
                  reactComponentsImports,
                  generatedGraphqlImports,
                },
              }),
            );

            await builder.apply(
              renderTextTemplateFileAction({
                template:
                  REACT_UPLOAD_COMPONENTS_TEXT_TEMPLATES.fileInputUploadGql,
                destination: gqlFilePath,
                variables: {
                  TPL_FILE_TYPE: capitalize(fileModelName),
                },
              }),
            );

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: REACT_UPLOAD_COMPONENTS_TS_TEMPLATES.hooksUseUpload,
                destination: hookPath,
              }),
            );
          },
        };
      },
    }),
  }),
});

export { uploadComponentsImportsProvider } from './generated/ts-import-maps.js';
