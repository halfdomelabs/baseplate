import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  generatedGraphqlImportsProvider,
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';

const fileInputComponent = createTsTemplateFile({
  importMapProviders: {
    generatedGraphqlImports: generatedGraphqlImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'file-input-component',
  projectExports: { FileInput: { exportName: 'default' } },
  source: { path: 'components/FileInput/index.tsx' },
  variables: {},
});

const hooksUseUpload = createTsTemplateFile({
  name: 'hooks-use-upload',
  projectExports: { useUpload: {} },
  source: { path: 'hooks/useUpload.ts' },
  variables: {},
});

export const REACT_UPLOAD_COMPONENTS_TS_TEMPLATES = {
  fileInputComponent,
  hooksUseUpload,
};
