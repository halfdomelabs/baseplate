import { getPackageVersion } from '@baseplate-dev/utils/node';
import { program } from 'commander';

import { addConfigCommand } from './commands/config.js';
import { addDiffCommand } from './commands/diff.js';
import { addMcpCommand } from './commands/mcp.js';
import { addProjectsCommand } from './commands/projects.js';
import { addServeCommand } from './commands/server.js';
import { addSyncFileCommand } from './commands/sync-file.js';
import { addSyncCommand } from './commands/sync.js';

/**
 * This is the entry point for the CLI. It is used to parse the command line
 * arguments and execute the appropriate command.
 */
export async function runCli(): Promise<void> {
  const version = (await getPackageVersion(import.meta.dirname)) ?? '0.0.0';

  program.version(version, '-v, --version');

  addSyncCommand(program);
  addSyncFileCommand(program);
  addDiffCommand(program);
  addServeCommand(program);
  addProjectsCommand(program);
  addConfigCommand(program);
  addMcpCommand(program);

  await program.parseAsync(process.argv);
}
