import type { FeatureFlag } from '@halfdomelabs/project-builder-lib';
import type { Logger } from '@halfdomelabs/sync';

import type { BuilderServiceManager } from '#src/server/builder-service-manager.js';
import type { BaseplateUserConfig } from '#src/user-config/user-config-schema.js';

export interface BaseplateApiContext {
  cliVersion: string;
  serviceManager: BuilderServiceManager;
  logger: Logger;
  featureFlags: FeatureFlag[];
  userConfig: BaseplateUserConfig;
  serverPort: number;
}
