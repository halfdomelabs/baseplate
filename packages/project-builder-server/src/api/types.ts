import { Logger } from '@halfdomelabs/sync';

import { ProjectBuilderService } from '@src/service/builder-service.js';

export interface BaseplateApiContext {
  cliVersion: string;
  services: ProjectBuilderService[];
  logger: Logger;
}
