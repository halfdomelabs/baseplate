import { program } from 'commander';

import { addBuildCommand } from './commands/build.js';
import { addExtractCommand } from './commands/extract.js';
import { addServeCommand } from './commands/server.js';
import { getEnabledFeatureFlags } from './services/feature-flags.js';
import { logger } from './services/logger.js';
import { getPackageVersion } from './utils/version.js';

async function runMain(): Promise<void> {
  const version = await getPackageVersion();
  const enabledFlags = getEnabledFeatureFlags();

  program.version(version, '-v, --version');

  if (enabledFlags.includes('BASEPLATE_TEMPLATE_EXTRACTOR')) {
    addExtractCommand(program);
  }

  addBuildCommand(program);

  addServeCommand(program);

  await program.parseAsync(process.argv);
}

try {
  await runMain();
} catch (err) {
  logger.error(err);
}
