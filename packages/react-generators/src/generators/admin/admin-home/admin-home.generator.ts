import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { posixJoin } from '@baseplate-dev/utils/node';
import { z } from 'zod';

import { reactRouterProvider } from '#src/generators/core/index.js';
import { reactRoutesProvider } from '#src/providers/index.js';

import { ADMIN_ADMIN_HOME_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

export const adminHomeGenerator = createGenerator({
  name: 'admin/admin-home',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: ADMIN_ADMIN_HOME_GENERATED.paths.task,
    renderers: ADMIN_ADMIN_HOME_GENERATED.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        renderers: ADMIN_ADMIN_HOME_GENERATED.renderers.provider,
        reactRoutes: reactRoutesProvider,
        reactRouter: reactRouterProvider,
      },
      run({ renderers, reactRoutes, reactRouter }) {
        return {
          build: async (builder) => {
            await builder.apply(
              renderers.rootIndex.render({
                id: 'root-index',
                destination: posixJoin(
                  reactRouter.getRootRouteDirectory(),
                  'index.tsx',
                ),
              }),
            );
            await builder.apply(
              renderers.home.render({
                variables: {
                  TPL_ROUTE_PATH: quot(`${reactRoutes.getRouteFilePath()}/`),
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
