import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface AdminAdminComponentsPaths {
  embeddedListField: string;
  embeddedListInput: string;
  embeddedObjectField: string;
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
          embeddedListField: `${srcRoot}/components/embedded-list-field/embedded-list-field.tsx`,
          embeddedListInput: `${srcRoot}/components/embedded-list-input/embedded-list-input.tsx`,
          embeddedObjectField: `${srcRoot}/components/embedded-object-field/embedded-object-field.tsx`,
          embeddedObjectInput: `${srcRoot}/components/embedded-object-input/embedded-object-input.tsx`,
        },
      },
    };
  },
});

export const ADMIN_ADMIN_COMPONENTS_PATHS = {
  provider: adminAdminComponentsPaths,
  task: adminAdminComponentsPathsTask,
};
