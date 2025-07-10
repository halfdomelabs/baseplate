import { program } from 'commander';

import { addBuildCommand } from './commands/build.js';
import { addConfigCommand } from './commands/config.js';
import { addDiffCommand } from './commands/diff.js';
import { addServeCommand } from './commands/server.js';
import { addTemplatesCommand } from './commands/templates.js';
import { getEnabledFeatureFlags } from './services/feature-flags.js';
import { getPackageVersion } from './utils/version.js';

/**
 * This is the entry point for the CLI. It is used to parse the command line
 * arguments and execute the appropriate command.
 */
export async function runCli(): Promise<void> {
  const version = await getPackageVersion();
  const enabledFlags = getEnabledFeatureFlags();

  program.version(version, '-v, --version');

  if (enabledFlags.includes('TEMPLATE_EXTRACTOR')) {
    addTemplatesCommand(program);
  }

  addBuildCommand(program);
  addDiffCommand(program);
  addServeCommand(program);
  addConfigCommand(program);

  await program.parseAsync(process.argv);
}
