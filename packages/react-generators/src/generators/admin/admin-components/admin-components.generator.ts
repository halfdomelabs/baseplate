import {
  createNodePackagesTask,
  extractPackageVersions,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '#src/constants/react-packages.js';
import {
  reactComponentsImportsProvider,
  reactComponentsProvider,
} from '#src/generators/core/react-components/index.js';

import { ADMIN_ADMIN_COMPONENTS_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

export const adminComponentsGenerator = createGenerator({
  name: 'admin/admin-components',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, ['nanoid']),
    }),
    paths: ADMIN_ADMIN_COMPONENTS_GENERATED.paths.task,
    imports: ADMIN_ADMIN_COMPONENTS_GENERATED.imports.task,
    main: createGeneratorTask({
      dependencies: {
        reactComponents: reactComponentsProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        typescriptFile: typescriptFileProvider,
        paths: ADMIN_ADMIN_COMPONENTS_GENERATED.paths.provider,
      },
      run({ reactComponents, reactComponentsImports, typescriptFile, paths }) {
        reactComponents.registerComponent({ name: 'EmbeddedListInput' });
        reactComponents.registerComponent({
          name: 'EmbeddedObjectInput',
        });
        reactComponents.registerComponent({ name: 'DescriptionList' });

        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group:
                  ADMIN_ADMIN_COMPONENTS_GENERATED.templates.componentsGroup,
                paths,
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
