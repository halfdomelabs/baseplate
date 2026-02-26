import { getPackageVersion } from '@baseplate-dev/utils/node';
import { program } from 'commander';

import { addDevServerCommand } from './commands/dev-server.js';
import { addDiffCommand } from './commands/diff.js';
import { addMcpCommand } from './commands/mcp.js';
import { addServeCommand } from './commands/serve.js';
import { addSnapshotCommand } from './commands/snapshot.js';
import { addSyncExamplesCommand } from './commands/sync-examples.js';
import { addSyncCommand } from './commands/sync.js';
import { addTemplatesCommand } from './commands/templates.js';

/**
 * This is the entry point for the dev CLI. It provides developer tooling
 * commands for Baseplate plugin authors and internal development.
 */
export async function runDevCli(): Promise<void> {
  const version = (await getPackageVersion(import.meta.dirname)) ?? '0.0.0';

  program.version(version, '-v, --version');

  addSyncCommand(program);
  addDiffCommand(program);
  addTemplatesCommand(program);
  addSnapshotCommand(program);
  addSyncExamplesCommand(program);
  addServeCommand(program);
  addDevServerCommand(program);
  addMcpCommand(program);

  await program.parseAsync(process.argv);
}

export { generateProject } from './runner/generate.js';
