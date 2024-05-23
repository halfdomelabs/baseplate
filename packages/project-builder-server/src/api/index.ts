import { FeatureFlag } from '@halfdomelabs/project-builder-lib';

import { authRouter } from './auth.js';
import { createPluginsRouter } from './plugins.js';
import { createProjectsRouter } from './projects.js';
import { createSyncRouter } from './sync.js';
import { publicProcedure, router } from './trpc.js';
import { BaseplateApiContext } from './types.js';

export interface ClientVersionInfo {
  version: string;
  featureFlags: FeatureFlag[];
}

// we need to infer the type of the router for TRPC to work
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createAppRouter(context: BaseplateApiContext) {
  return router({
    auth: authRouter,
    projects: createProjectsRouter(context),
    sync: createSyncRouter(context),
    version: publicProcedure.query((): ClientVersionInfo => {
      return {
        version: context.cliVersion,
        featureFlags: context.featureFlags,
      };
    }),
    plugins: createPluginsRouter(context),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
