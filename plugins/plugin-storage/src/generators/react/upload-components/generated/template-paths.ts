import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface ReactUploadComponentsPaths {
  fileInputUploadGql: string;
  fileInputField: string;
  fileInputComponent: string;
  hooksUseUpload: string;
}

const reactUploadComponentsPaths =
  createProviderType<ReactUploadComponentsPaths>(
    'react-upload-components-paths',
  );

const reactUploadComponentsPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { reactUploadComponentsPaths: reactUploadComponentsPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        reactUploadComponentsPaths: {
          fileInputComponent: `${srcRoot}/components/file-input/file-input.tsx`,
          fileInputField: `${srcRoot}/components/file-input-field/file-input-field.tsx`,
          fileInputUploadGql: `${srcRoot}/components/file-input/upload.gql`,
          hooksUseUpload: `${srcRoot}/hooks/useUpload.ts`,
        },
      },
    };
  },
});

export const REACT_UPLOAD_COMPONENTS_PATHS = {
  provider: reactUploadComponentsPaths,
  task: reactUploadComponentsPathsTask,
};
