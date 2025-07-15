import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { reactPathsProvider } from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface ReactUploadComponentsPaths {
  fileInputComponent: string;
  fileInputField: string;
  fileInputUploadGql: string;
  hooksUseUpload: string;
}

const reactUploadComponentsPaths =
  createProviderType<ReactUploadComponentsPaths>(
    'react-upload-components-paths',
  );

const reactUploadComponentsPathsTask = createGeneratorTask({
  dependencies: {
    packageInfo: packageInfoProvider,
    reactPaths: reactPathsProvider,
  },
  exports: { reactUploadComponentsPaths: reactUploadComponentsPaths.export() },
  run({ packageInfo, reactPaths }) {
    const componentsRoot = reactPaths.getComponentsFolder();
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        reactUploadComponentsPaths: {
          fileInputComponent: `${componentsRoot}/file-input/file-input.tsx`,
          fileInputField: `${componentsRoot}/file-input-field/file-input-field.tsx`,
          fileInputUploadGql: `${componentsRoot}/file-input/upload.gql`,
          hooksUseUpload: `${srcRoot}/hooks/use-upload.ts`,
        },
      },
    };
  },
});

export const REACT_UPLOAD_COMPONENTS_PATHS = {
  provider: reactUploadComponentsPaths,
  task: reactUploadComponentsPathsTask,
};
