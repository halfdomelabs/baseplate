import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { reactPathsProvider } from '#src/providers/react-paths.js';

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
  dependencies: { reactPaths: reactPathsProvider },
  exports: { adminAdminComponentsPaths: adminAdminComponentsPaths.export() },
  run({ reactPaths }) {
    const componentsRoot = reactPaths.getComponentsFolder();

    return {
      providers: {
        adminAdminComponentsPaths: {
          embeddedListField: `${componentsRoot}/embedded-list-field/embedded-list-field.tsx`,
          embeddedListInput: `${componentsRoot}/embedded-list-input/embedded-list-input.tsx`,
          embeddedObjectField: `${componentsRoot}/embedded-object-field/embedded-object-field.tsx`,
          embeddedObjectInput: `${componentsRoot}/embedded-object-input/embedded-object-input.tsx`,
        },
      },
    };
  },
});

export const ADMIN_ADMIN_COMPONENTS_PATHS = {
  provider: adminAdminComponentsPaths,
  task: adminAdminComponentsPathsTask,
};
