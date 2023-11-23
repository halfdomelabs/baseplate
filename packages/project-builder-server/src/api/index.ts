import { authRouter } from './auth.js';
import { createProjectsRouter } from './projects.js';
import { createSyncRouter } from './sync.js';
import { publicProcedure, router } from './trpc.js';
import { BaseplateApiContext } from './types.js';

// we need to infer the type of the router for TRPC to work
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createAppRouter(context: BaseplateApiContext) {
  return router({
    auth: authRouter,
    projects: createProjectsRouter(context),
    sync: createSyncRouter(context),
    version: publicProcedure.query(() => {
      return context.cliVersion;
    }),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
