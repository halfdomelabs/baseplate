import {
  GeneratorEngineSetupConfig,
  discoverGenerators,
} from '@halfdomelabs/project-builder-server';
import { fileURLToPath } from 'url';

import { logger } from './logger.js';

export async function getGeneratorSetupConfig(): Promise<GeneratorEngineSetupConfig> {
  return discoverGenerators(fileURLToPath(import.meta.url), logger);
}
