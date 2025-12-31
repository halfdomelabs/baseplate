import {
  createTextTemplateFile,
  createTsTemplateFile,
} from '@baseplate-dev/core-generators';
import {
  graphqlImportsProvider,
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import path from 'node:path';

const fileInputComponent = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    generatedGraphqlImports: graphqlImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'file-input-component',
  projectExports: { FileInput: { exportedAs: 'default' } },
  referencedGeneratorTemplates: { hooksUseUpload: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/file-input.tsx',
    ),
  },
  variables: {},
});

const fileInputField = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'file-input-field',
  projectExports: { FileInputField: {}, FileInputFieldController: {} },
  referencedGeneratorTemplates: { fileInputComponent: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/file-input-field.tsx',
    ),
  },
  variables: {},
});

const fileInputUploadGql = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'file-input-upload-gql',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/file-input.gql',
    ),
  },
  variables: { TPL_FILE_TYPE: {} },
});

const hooksUseUpload = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'hooks-use-upload',
  projectExports: { useUpload: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/hooks/use-upload.ts',
    ),
  },
  variables: {},
});

export const REACT_UPLOAD_COMPONENTS_TEMPLATES = {
  fileInputComponent,
  fileInputField,
  fileInputUploadGql,
  hooksUseUpload,
};
