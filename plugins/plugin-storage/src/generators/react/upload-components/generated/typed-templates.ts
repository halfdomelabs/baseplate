import {
  createTextTemplateFile,
  createTsTemplateFile,
} from '@baseplate-dev/core-generators';
import {
  generatedGraphqlImportsProvider,
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import path from 'node:path';

const fileInputComponent = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    generatedGraphqlImports: generatedGraphqlImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'file-input-component',
  projectExports: { FileInput: { exportName: 'default' } },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/FileInput/index.tsx',
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
      '../templates/src/components/FileInput/upload.gql',
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
    path: path.join(import.meta.dirname, '../templates/src/hooks/useUpload.ts'),
  },
  variables: {},
});

export const REACT_UPLOAD_COMPONENTS_TEMPLATES = {
  fileInputUploadGql,
  fileInputComponent,
  hooksUseUpload,
};
