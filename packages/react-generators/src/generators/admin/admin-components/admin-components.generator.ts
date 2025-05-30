import {
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '#src/constants/react-packages.js';
import {
  reactComponentsImportsProvider,
  reactComponentsProvider,
} from '#src/generators/core/react-components/react-components.generator.js';

import {
  adminComponentsImportsProvider,
  createAdminComponentsImports,
} from './generated/ts-import-maps.js';
import { ADMIN_ADMIN_COMPONENTS_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

export const adminComponentsGenerator = createGenerator({
  name: 'admin/admin-components',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, ['nanoid']),
    }),
    main: createGeneratorTask({
      dependencies: {
        reactComponents: reactComponentsProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        typescriptFile: typescriptFileProvider,
      },
      exports: {
        adminComponentsImports:
          adminComponentsImportsProvider.export(projectScope),
      },
      run({ reactComponents, reactComponentsImports, typescriptFile }) {
        reactComponents.registerComponent({ name: 'EmbeddedListInput' });
        reactComponents.registerComponent({
          name: 'EmbeddedObjectInput',
        });
        reactComponents.registerComponent({ name: 'DescriptionList' });

        return {
          providers: {
            adminComponentsImports: createAdminComponentsImports(
              reactComponents.getComponentsFolder(),
            ),
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: ADMIN_ADMIN_COMPONENTS_TS_TEMPLATES.componentsGroup,
                baseDirectory: reactComponents.getComponentsFolder(),
                importMapProviders: {
                  reactComponentsImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});

export { adminComponentsImportsProvider } from './generated/ts-import-maps.js';
export type { AdminComponentsImportsProvider } from './generated/ts-import-maps.js';
