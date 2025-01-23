import { describe, expect, it } from 'vitest';

import { sortPostWriteCommands } from './sort-commands.js';
import { type PostWriteCommand } from './types.js';

describe('sortPostWriteCommands', () => {
  it('should sort commands by priority', () => {
    const commands: PostWriteCommand[] = [
      { command: 'default command', options: { priority: 'DEFAULT' } },
      { command: 'codegen command', options: { priority: 'CODEGEN' } },
      { command: 'deps command', options: { priority: 'DEPENDENCIES' } },
    ];

    const sorted = sortPostWriteCommands(commands);

    expect(sorted.map((c) => c.command)).toEqual([
      'deps command',
      'codegen command',
      'default command',
    ]);
  });

  it('should handle numeric priorities', () => {
    const commands: PostWriteCommand[] = [
      { command: 'priority 500', options: { priority: 500 } },
      { command: 'priority 100', options: { priority: 100 } },
      { command: 'priority 300', options: { priority: 300 } },
    ];

    const sorted = sortPostWriteCommands(commands);

    expect(sorted.map((c) => c.command)).toEqual([
      'priority 100',
      'priority 300',
      'priority 500',
    ]);
  });

  it('should treat commands without priority as default', () => {
    const commands: PostWriteCommand[] = [
      { command: 'no priority' },
      { command: 'deps command', options: { priority: 'DEPENDENCIES' } },
    ];

    const sorted = sortPostWriteCommands(commands);

    expect(sorted.map((c) => c.command)).toEqual([
      'deps command',
      'no priority',
    ]);
  });
});
