import type { FeatureFlag } from '@baseplate-dev/project-builder-lib';

import type { BaseplateUserConfig } from '#src/user-config/user-config-schema.js';

import { publicProcedure, router } from './trpc.js';

export interface ClientVersionInfo {
  version: string;
  featureFlags: FeatureFlag[];
  userConfig: BaseplateUserConfig;
}

export const versionRouter = router({
  get: publicProcedure.query(
    ({ ctx }): ClientVersionInfo => ({
      version: ctx.cliVersion,
      featureFlags: ctx.featureFlags,
      userConfig: ctx.userConfig,
    }),
  ),
});
