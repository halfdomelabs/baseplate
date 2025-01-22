import { describe, expect, it } from 'vitest';

import { filterPostWriteCommands } from './filter-commands.js';
import { type PostWriteCommand } from './types.js';

describe('filterPostWriteCommands', () => {
  it('should include commands without onlyIfChanged option', () => {
    const commands: PostWriteCommand[] = [
      { command: 'always run' },
      { command: 'also always run', options: {} },
    ];

    const filtered = filterPostWriteCommands(commands, {
      modifiedRelativePaths: new Set(),
      rerunCommands: [],
    });

    expect(filtered).toEqual(commands);
  });

  it('should filter commands based on modified paths', () => {
    const commands: PostWriteCommand[] = [
      {
        command: 'run on package.json',
        options: { onlyIfChanged: 'package.json' },
      },
      {
        command: 'run on src changes',
        options: { onlyIfChanged: ['src/index.ts'] },
      },
      { command: 'always run' },
    ];

    const filtered = filterPostWriteCommands(commands, {
      modifiedRelativePaths: new Set(['package.json']),
      rerunCommands: [],
    });

    expect(filtered.map((c) => c.command)).toEqual([
      'run on package.json',
      'always run',
    ]);
  });

  it('should include commands specified in rerunCommands', () => {
    const commands: PostWriteCommand[] = [
      { command: 'npm install', options: { onlyIfChanged: 'package.json' } },
      {
        command: 'generate types',
        options: { onlyIfChanged: ['src/index.ts'] },
      },
    ];

    const filtered = filterPostWriteCommands(commands, {
      modifiedRelativePaths: new Set(),
      rerunCommands: ['npm install'],
    });

    expect(filtered.map((c) => c.command)).toEqual(['npm install']);
  });

  it('should handle array of onlyIfChanged paths', () => {
    const commands: PostWriteCommand[] = [
      {
        command: 'build deps',
        options: { onlyIfChanged: ['package.json', 'yarn.lock'] },
      },
    ];

    const filtered = filterPostWriteCommands(commands, {
      modifiedRelativePaths: new Set(['yarn.lock']),
      rerunCommands: [],
    });

    expect(filtered).toEqual(commands);
  });

  it('should exclude commands when no matching paths are modified', () => {
    const commands: PostWriteCommand[] = [
      {
        command: 'build deps',
        options: { onlyIfChanged: ['package.json', 'yarn.lock'] },
      },
    ];

    const filtered = filterPostWriteCommands(commands, {
      modifiedRelativePaths: new Set(['src/index.ts']),
      rerunCommands: [],
    });

    expect(filtered).toEqual([]);
  });
});
