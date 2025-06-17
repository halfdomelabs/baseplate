import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  projectScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { REACT_UPLOAD_COMPONENTS_PATHS } from './template-paths.js';

const uploadComponentsImportsSchema = createTsImportMapSchema({
  FileInput: { exportedAs: 'default' },
  useUpload: {},
});

export type UploadComponentsImportsProvider = TsImportMapProviderFromSchema<
  typeof uploadComponentsImportsSchema
>;

export const uploadComponentsImportsProvider =
  createReadOnlyProviderType<UploadComponentsImportsProvider>(
    'upload-components-imports',
  );

const reactUploadComponentsImportsTask = createGeneratorTask({
  dependencies: {
    paths: REACT_UPLOAD_COMPONENTS_PATHS.provider,
  },
  exports: {
    uploadComponentsImports:
      uploadComponentsImportsProvider.export(projectScope),
  },
  run({ paths }) {
    return {
      providers: {
        uploadComponentsImports: createTsImportMap(
          uploadComponentsImportsSchema,
          {
            FileInput: paths.fileInputComponent,
            useUpload: paths.hooksUseUpload,
          },
        ),
      },
    };
  },
});

export const REACT_UPLOAD_COMPONENTS_IMPORTS = {
  task: reactUploadComponentsImportsTask,
};
