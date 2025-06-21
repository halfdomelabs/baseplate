import { normalizePathToOutputPath } from '#src/utils/canonical-path.js';

import type { PostWriteCommand } from './types.js';

/**
 * Filter post-write commands
 *
 * @param commands - The commands to filter
 * @param options - Filter options
 * @param options.modifiedRelativePaths - The modified relative paths
 * @param options.rerunCommands - The rerun commands
 * @returns The filtered commands
 */
export function filterPostWriteCommands(
  commands: PostWriteCommand[],
  {
    modifiedRelativePaths,
    rerunCommands,
  }: {
    modifiedRelativePaths: Set<string>;
    rerunCommands: string[];
  },
): PostWriteCommand[] {
  return commands.filter((command) => {
    const { onlyIfChanged = [] } = command.options ?? {};
    const onlyIfChangedArr = Array.isArray(onlyIfChanged)
      ? onlyIfChanged
      : [onlyIfChanged];

    return (
      command.options?.onlyIfChanged == null ||
      onlyIfChangedArr.some((file) =>
        modifiedRelativePaths.has(normalizePathToOutputPath(file)),
      ) ||
      rerunCommands.includes(command.command)
    );
  });
}
