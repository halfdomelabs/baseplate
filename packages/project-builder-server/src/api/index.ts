import { authRouter } from './auth.js';
import { pluginsRouter } from './plugins.js';
import { projectsRouter } from './projects.js';
import { syncRouter } from './sync.js';
import { router } from './trpc.js';
import { versionRouter } from './version.js';

export type { ProjectInfo } from './projects.js';
export type { ClientVersionInfo } from './version.js';

export const appRouter = router({
  auth: authRouter,
  projects: projectsRouter,
  sync: syncRouter,
  version: versionRouter,
  plugins: pluginsRouter,
});

export type AppRouter = typeof appRouter;
