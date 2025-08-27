import { diffProjectAction } from '#src/actions/diff/diff-project.action.js';

import { devRouter, devTrpcActionBuilder } from './trpc.js';

export const devServerRouter = devRouter({
  diff: devRouter({
    diffProject: devTrpcActionBuilder.mutation(diffProjectAction),
  }),
});

export type DevServerRouter = typeof devServerRouter;
