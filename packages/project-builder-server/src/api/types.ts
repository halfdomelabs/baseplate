import type { FeatureFlag } from '@halfdomelabs/project-builder-lib';
import type { Logger } from '@halfdomelabs/sync';

import type { BuilderServiceManager } from '@src/server/builder-service-manager.js';

export interface BaseplateApiContext {
  cliVersion: string;
  serviceManager: BuilderServiceManager;
  logger: Logger;
  featureFlags: FeatureFlag[];
}
