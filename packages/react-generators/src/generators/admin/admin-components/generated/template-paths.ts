import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface AdminAdminComponentsPaths {
  descriptionList: string;
  embeddedListInput: string;
  embeddedObjectInput: string;
}

const adminAdminComponentsPaths = createProviderType<AdminAdminComponentsPaths>(
  'admin-admin-components-paths',
);

const adminAdminComponentsPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { adminAdminComponentsPaths: adminAdminComponentsPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        adminAdminComponentsPaths: {
          descriptionList: `${srcRoot}/components/DescriptionList/index.tsx`,
          embeddedListInput: `${srcRoot}/components/EmbeddedListInput/index.tsx`,
          embeddedObjectInput: `${srcRoot}/components/EmbeddedObjectInput/index.tsx`,
        },
      },
    };
  },
});

export const ADMIN_ADMIN_COMPONENTS_PATHS = {
  provider: adminAdminComponentsPaths,
  task: adminAdminComponentsPathsTask,
};
