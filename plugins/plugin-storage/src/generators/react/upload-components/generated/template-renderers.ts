import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  graphqlImportsProvider,
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { REACT_UPLOAD_COMPONENTS_PATHS } from './template-paths.js';
import { REACT_UPLOAD_COMPONENTS_TEMPLATES } from './typed-templates.js';

export interface ReactUploadComponentsRenderers {
  fileInputComponent: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof REACT_UPLOAD_COMPONENTS_TEMPLATES.fileInputComponent
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  fileInputField: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof REACT_UPLOAD_COMPONENTS_TEMPLATES.fileInputField
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  hooksUseUpload: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof REACT_UPLOAD_COMPONENTS_TEMPLATES.hooksUseUpload
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const reactUploadComponentsRenderers =
  createProviderType<ReactUploadComponentsRenderers>(
    'react-upload-components-renderers',
  );

const reactUploadComponentsRenderersTask = createGeneratorTask({
  dependencies: {
    graphqlImports: graphqlImportsProvider,
    paths: REACT_UPLOAD_COMPONENTS_PATHS.provider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    reactUploadComponentsRenderers: reactUploadComponentsRenderers.export(),
  },
  run({
    graphqlImports,
    paths,
    reactComponentsImports,
    reactErrorImports,
    typescriptFile,
  }) {
    return {
      providers: {
        reactUploadComponentsRenderers: {
          fileInputComponent: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: REACT_UPLOAD_COMPONENTS_TEMPLATES.fileInputComponent,
                destination: paths.fileInputComponent,
                importMapProviders: {
                  graphqlImports,
                  reactComponentsImports,
                  reactErrorImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          fileInputField: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: REACT_UPLOAD_COMPONENTS_TEMPLATES.fileInputField,
                destination: paths.fileInputField,
                importMapProviders: {
                  reactComponentsImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          hooksUseUpload: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: REACT_UPLOAD_COMPONENTS_TEMPLATES.hooksUseUpload,
                destination: paths.hooksUseUpload,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const REACT_UPLOAD_COMPONENTS_RENDERERS = {
  provider: reactUploadComponentsRenderers,
  task: reactUploadComponentsRenderersTask,
};
