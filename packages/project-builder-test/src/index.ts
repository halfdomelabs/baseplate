import { program } from 'commander';

import { addCliCommands } from './commands/index.js';
import { HandledError } from './errors/handled-error.js';
import { logger } from './utils/console.js';

export async function main(): Promise<void> {
  addCliCommands(program);

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  if (err instanceof HandledError) {
    process.exit(1);
  }
  logger.error(err);
  process.exit(1);
});
