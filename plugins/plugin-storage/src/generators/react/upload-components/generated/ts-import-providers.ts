import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { REACT_UPLOAD_COMPONENTS_PATHS } from './template-paths.js';

export const uploadComponentsImportsSchema = createTsImportMapSchema({
  FileCategory: { isTypeOnly: true },
  FileInput: {},
  FileInputField: {},
  FileInputFieldController: {},
  fileInputValueFragment: {},
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
      uploadComponentsImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        uploadComponentsImports: createTsImportMap(
          uploadComponentsImportsSchema,
          {
            FileCategory: paths.fileInputComponent,
            FileInput: paths.fileInputComponent,
            FileInputField: paths.fileInputField,
            FileInputFieldController: paths.fileInputField,
            fileInputValueFragment: paths.fileInputComponent,
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
