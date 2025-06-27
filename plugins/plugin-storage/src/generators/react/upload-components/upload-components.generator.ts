import {
  CORE_PACKAGES,
  createNodePackagesTask,
  renderTextTemplateFileAction,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  generatedGraphqlImportsProvider,
  reactApolloProvider,
  reactComponentsImportsProvider,
  reactComponentsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { capitalize } from 'inflection';
import { z } from 'zod';

import { STORAGE_PACKAGES } from '#src/constants/index.js';

import { REACT_UPLOAD_COMPONENTS_GENERATED } from './generated/index.js';

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
    paths: REACT_UPLOAD_COMPONENTS_GENERATED.paths.task,
    imports: REACT_UPLOAD_COMPONENTS_GENERATED.imports.task,
    main: createGeneratorTask({
      dependencies: {
        reactErrorImports: reactErrorImportsProvider,
        typescriptFile: typescriptFileProvider,
        reactComponents: reactComponentsProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        generatedGraphqlImports: generatedGraphqlImportsProvider,
        reactApollo: reactApolloProvider,
        paths: REACT_UPLOAD_COMPONENTS_GENERATED.paths.provider,
      },
      run({
        reactErrorImports,
        typescriptFile,
        reactComponentsImports,
        generatedGraphqlImports,
        reactApollo,
        reactComponents,
        paths,
      }) {
        reactComponents.registerComponent({
          name: 'file-input',
          isBarrelExport: true,
        });

        reactApollo.registerGqlFile(paths.fileInputUploadGql);

        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  REACT_UPLOAD_COMPONENTS_GENERATED.templates
                    .fileInputComponent,
                destination: paths.fileInputComponent,
                importMapProviders: {
                  reactErrorImports,
                  reactComponentsImports,
                  generatedGraphqlImports,
                },
              }),
            );

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  REACT_UPLOAD_COMPONENTS_GENERATED.templates.fileInputField,
                destination: paths.fileInputField,
                importMapProviders: {
                  reactComponentsImports,
                },
              }),
            );

            await builder.apply(
              renderTextTemplateFileAction({
                template:
                  REACT_UPLOAD_COMPONENTS_GENERATED.templates
                    .fileInputUploadGql,
                destination: paths.fileInputUploadGql,
                variables: {
                  TPL_FILE_TYPE: capitalize(fileModelName),
                },
              }),
            );

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  REACT_UPLOAD_COMPONENTS_GENERATED.templates.hooksUseUpload,
                destination: paths.hooksUseUpload,
              }),
            );
          },
        };
      },
    }),
  }),
});
