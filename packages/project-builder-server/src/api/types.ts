import type { FeatureFlag } from '@halfdomelabs/project-builder-lib';
import type { Logger } from '@halfdomelabs/sync';

import type { ProjectBuilderService } from '@src/service/builder-service.js';

export interface BaseplateApiContext {
  cliVersion: string;
  services: ProjectBuilderService[];
  logger: Logger;
  featureFlags: FeatureFlag[];
}
