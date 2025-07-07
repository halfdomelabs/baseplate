import { pathRootsProvider } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { convertCaseWithPrefix } from '@baseplate-dev/utils';
import { kebabCase } from 'es-toolkit';
import { z } from 'zod';

import { reactRoutesProvider } from '#src/providers/routes.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
});

export const reactRoutesGenerator = createGenerator({
  name: 'core/react-routes',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.name,
  buildTasks: ({ name }) => ({
    main: createGeneratorTask({
      dependencies: {
        reactRoutes: reactRoutesProvider.dependency().parentScopeOnly(),
        pathRoots: pathRootsProvider.dependency(),
      },
      exports: {
        reactRoutes: reactRoutesProvider.export(),
      },
      run({ reactRoutes, pathRoots }) {
        const pathName = convertCaseWithPrefix(name, kebabCase);

        const directoryBase = `${reactRoutes.getOutputRelativePath()}/${pathName}`;

        // Register routes-root path root
        pathRoots.registerPathRoot('routes-root', directoryBase);

        return {
          providers: {
            reactRoutes: {
              getOutputRelativePath: () => directoryBase,
              getRoutePrefix: () =>
                pathName.startsWith('_')
                  ? reactRoutes.getRoutePrefix()
                  : `${reactRoutes.getRoutePrefix()}/${pathName}`,
              getRouteFilePath: () =>
                `${reactRoutes.getRouteFilePath()}/${pathName}`,
            },
          },
        };
      },
    }),
  }),
});
