import { sortBy } from 'es-toolkit';

import { POST_WRITE_COMMAND_PRIORITY, type PostWriteCommand } from './types.js';

/**
 * Sort post-write commands by priority
 *
 * @param commands - The commands to sort
 * @returns The sorted commands
 */
export function sortPostWriteCommands(
  commands: PostWriteCommand[],
): PostWriteCommand[] {
  const sortedCommands = sortBy(commands, [
    (command) => {
      const priority = command.options?.priority ?? 'DEFAULT';
      if (
        typeof priority === 'string' &&
        !(priority in POST_WRITE_COMMAND_PRIORITY)
      ) {
        throw new Error(`Invalid priority: ${priority}`);
      }
      return typeof priority === 'number'
        ? priority
        : POST_WRITE_COMMAND_PRIORITY[priority];
    },
  ]);

  return sortedCommands;
}
