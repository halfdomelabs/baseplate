import type { FeatureFlag } from '@halfdomelabs/project-builder-lib';

import { publicProcedure, router } from './trpc.js';

export interface ClientVersionInfo {
  version: string;
  featureFlags: FeatureFlag[];
}

export const versionRouter = router({
  get: publicProcedure.query(
    ({ ctx }): ClientVersionInfo => ({
      version: ctx.cliVersion,
      featureFlags: ctx.featureFlags,
    }),
  ),
});
