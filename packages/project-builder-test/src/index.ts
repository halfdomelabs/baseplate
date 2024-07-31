import { program } from 'commander';

import { addCliCommands } from './commands/index.js';
import { logger } from './utils/console.js';

export async function main(): Promise<void> {
  addCliCommands(program);

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  logger.error(err);
});
