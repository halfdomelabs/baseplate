#!/usr/bin/env node

import { program } from 'commander';

import { addBuildCommand } from './commands/build.js';
import { addExtractTemplatesCommand } from './commands/extract-templates.js';
import { addServeCommand } from './commands/server.js';
import { getEnabledFeatureFlags } from './services/feature-flags.js';
import { logger } from './services/logger.js';
import { getPackageVersion } from './utils/version.js';

async function runMain(): Promise<void> {
  const version = await getPackageVersion();
  const enabledFlags = getEnabledFeatureFlags();

  program.version(version, '-v, --version');

  if (enabledFlags.includes('TEMPLATE_EXTRACTOR')) {
    addExtractTemplatesCommand(program);
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
