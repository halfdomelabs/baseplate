import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface ReactUploadComponentsPaths {
  fileInputUploadGql: string;
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
          fileInputComponent: `${srcRoot}/components/FileInput/index.tsx`,
          fileInputUploadGql: `${srcRoot}/components/FileInput/upload.gql`,
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
