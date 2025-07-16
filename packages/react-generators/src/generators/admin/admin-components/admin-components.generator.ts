import {
  createNodePackagesTask,
  extractPackageVersions,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '#src/constants/react-packages.js';

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
    renderers: ADMIN_ADMIN_COMPONENTS_GENERATED.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        renderers: ADMIN_ADMIN_COMPONENTS_GENERATED.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(renderers.componentsGroup.render({}));
          },
        };
      },
    }),
  }),
});
