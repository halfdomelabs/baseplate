import { beforeEach, describe, expect, it, vi } from 'vitest';

import { executeCommand } from '#src/utils/exec.js';

import { runPostWriteCommands } from './run-commands.js';
import { type PostWriteCommand } from './types.js';

// Mock executeCommand
vi.mock('#src/utils/exec.js', () => ({
  executeCommand: vi.fn(),
}));

const executeCommandMock = vi.mocked(executeCommand);

describe('runPostWriteCommands', () => {
  const mockLogger = {
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should run commands successfully', async () => {
    const commands: PostWriteCommand[] = [
      { command: 'echo "test"' },
      {
        command: 'npm install',
        options: { workingDirectory: 'packages/test' },
      },
    ];

    executeCommandMock.mockResolvedValue({
      failed: false,
      exitCode: 0,
      output: 'success',
    });

    const result = await runPostWriteCommands(commands, '/root', mockLogger);

    expect(result.failedCommands).toHaveLength(0);
    expect(executeCommandMock).toHaveBeenCalledTimes(2);
    expect(executeCommandMock).toHaveBeenCalledWith('echo "test"', {
      cwd: '/root',
      timeout: 300_000, // 5 minutes in milliseconds
    });
    expect(executeCommandMock).toHaveBeenCalledWith('npm install', {
      cwd: '/root/packages/test',
      timeout: 300_000,
    });
  });

  it('should handle command failures', async () => {
    const commands: PostWriteCommand[] = [{ command: 'failing-command' }];

    executeCommandMock.mockResolvedValue({
      failed: true,
      exitCode: 1,
      output: 'error message',
    });

    const result = await runPostWriteCommands(commands, '/root', mockLogger);

    expect(result.failedCommands).toEqual([
      {
        command: 'failing-command',
        workingDir: '/root',
        output: 'error message',
      },
    ]);
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('should respect custom timeout', async () => {
    const commands: PostWriteCommand[] = [
      { command: 'long-running', options: { timeout: 600_000 } }, // 10 minutes
    ];

    executeCommandMock.mockResolvedValue({
      failed: false,
      exitCode: 0,
      output: 'success',
    });

    await runPostWriteCommands(commands, '/root', mockLogger);

    expect(executeCommandMock).toHaveBeenCalledWith('long-running', {
      cwd: '/root',
      timeout: 600_000,
    });
  });
});
