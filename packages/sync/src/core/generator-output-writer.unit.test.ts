import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FormatterProvider } from '@src/providers/index.js';
import { executeCommand } from '../utils/exec.js';
import { createEventedLogger } from '../utils/index.js';
import { writeGeneratorOutput } from './generator-output-writer.js';

vi.mock('fs');
vi.mock('fs/promises');

vi.mock('../utils/exec.js');

const mockedExecuteCommand = vi.mocked(executeCommand);

beforeEach(() => {
  vol.reset();
});

const testLogger = createEventedLogger({ noConsole: true });

// TODO: Add tests for clean folder

describe('writeGeneratorOutput', () => {
  it('should write nothing with a blank output', async () => {
    await writeGeneratorOutput(
      { files: {}, postWriteCommands: [] },
      '/root',
      undefined,
      testLogger
    );
    expect(vol.toJSON()).toEqual({});
  });

  it('should write files only', async () => {
    const formatFunction = vi.fn().mockResolvedValue('formatted-output');
    const testFormatter: FormatterProvider = {
      format: formatFunction,
    };
    await writeGeneratorOutput(
      {
        files: {
          'file.txt': { contents: 'hi' },
          'formatted.txt': { contents: 'hello', formatter: testFormatter },
        },
        postWriteCommands: [],
      },
      '/root',
      undefined,
      testLogger
    );
    expect(vol.toJSON()).toEqual({
      '/root/file.txt': 'hi',
      '/root/formatted.txt': 'formatted-output',
    });
    expect(formatFunction).toHaveBeenCalledWith(
      'hello',
      '/root/formatted.txt',
      testLogger
    );
  });

  it('should perform 3-way merge', async () => {
    vol.fromJSON({
      '/root/file.txt': ['hello', 'bonjour', 'something', 'bye'].join('\n'),
      '/root/file2.txt': ['abc', 'def', 'ghi', 'jki'].join('\n'),
    });

    await writeGeneratorOutput(
      {
        files: {
          'file.txt': {
            contents: ['hello', 'hi', 'something', 'adios'].join('\n'),
            options: {
              cleanContents: Buffer.from(
                ['hello', 'hi', 'something', 'bye'].join('\n')
              ),
            },
          },
          'file2.txt': {
            contents: ['123', '456', '789', '012'].join('\n'),
            options: {
              cleanContents: Buffer.from(
                ['123', '456', '789', '012'].join('\n')
              ),
            },
          },
        },
        postWriteCommands: [],
      },
      '/root',
      {},
      testLogger
    );
    expect(vol.toJSON()).toEqual({
      '/root/file.txt': ['hello', 'bonjour', 'something', 'adios'].join('\n'),
      '/root/file2.txt': ['abc', 'def', 'ghi', 'jki'].join('\n'),
    });
  });

  it('should perform 3-way merge with conflict', async () => {
    vol.fromJSON({
      '/root/file.txt': ['hello', 'bonjour', 'something', 'bye'].join('\n'),
    });

    await writeGeneratorOutput(
      {
        files: {
          'file.txt': {
            contents: ['hello', 'hi', 'something', 'adios'].join('\n'),
            options: {
              cleanContents: Buffer.from(
                ['hello', 'hola', 'something', 'bye'].join('\n')
              ),
            },
          },
        },
        postWriteCommands: [],
      },
      '/root',
      undefined,
      testLogger
    );
    expect(vol.toJSON()).toEqual({
      '/root/file.txt': [
        'hello',
        '<<<<<<< existing',
        'bonjour',
        '=======',
        'hi',
        '>>>>>>> baseplate',
        'something',
        'adios',
      ].join('\n'),
    });
  });

  it('should perform 2-way merge with conflict', async () => {
    vol.fromJSON({
      '/root/file.txt': ['hello', 'hi', 'something', 'bye'].join('\n'),
    });

    await writeGeneratorOutput(
      {
        files: {
          'file.txt': {
            contents: ['hello', 'hi', 'something', 'adios'].join('\n'),
          },
        },
        postWriteCommands: [],
      },
      '/root',
      undefined,
      testLogger
    );
    expect(vol.toJSON()).toEqual({
      '/root/file.txt': [
        'hello',
        'hi',
        'something',
        '<<<<<<< existing',
        'bye',
        '=======',
        'adios',
        '>>>>>>> baseplate',
      ].join('\n'),
    });
  });

  it('should never overwrite files with neverOverwrite set', async () => {
    vol.fromJSON({ '/root/file.txt': 'hi' });

    await writeGeneratorOutput(
      {
        files: {
          'file.txt': { contents: 'hi2', options: { neverOverwrite: true } },
        },
        postWriteCommands: [],
      },
      '/root',
      undefined,
      testLogger
    );
    expect(vol.toJSON()).toEqual({ '/root/file.txt': 'hi' });
  });

  it('should write binary file', async () => {
    await writeGeneratorOutput(
      {
        files: { 'file.txt': { contents: Buffer.from('hi', 'utf8') } },
        postWriteCommands: [],
      },
      '/root',
      undefined,
      testLogger
    );
    expect(vol.toJSON()).toEqual({ '/root/file.txt': 'hi' });
  });

  it('should run post-write commands in correct order', async () => {
    await writeGeneratorOutput(
      {
        files: {},
        postWriteCommands: [
          {
            command: 'custom-script',
            options: { workingDirectory: '/folder' },
            commandType: 'script',
          },
          {
            command: 'custom',
            options: { workingDirectory: '/folder' },
            commandType: 'generation',
          },
          { command: 'pnpm install', commandType: 'dependencies' },
        ],
      },
      '/root',
      undefined,
      testLogger
    );
    expect(vol.toJSON()).toEqual({});

    expect(mockedExecuteCommand.mock.calls[0][0]).toBe('pnpm install');
    expect(mockedExecuteCommand.mock.calls[1][0]).toBe('custom');
    expect(mockedExecuteCommand.mock.calls[1][1]).toMatchObject({
      cwd: '/root/folder',
    });
    expect(mockedExecuteCommand.mock.calls[2][0]).toBe('custom-script');
  });

  it('should run post-write commands only on modified files', async () => {
    vol.fromJSON({
      '/root/file.txt': 'hi',
      '/root/file2.txt': 'hi2',
    });

    await writeGeneratorOutput(
      {
        files: {
          'file.txt': { contents: 'hi' },
          'file2.txt': {
            contents: 'hello',
            options: { cleanContents: Buffer.from('hi2') },
          },
        },
        postWriteCommands: [
          {
            command: 'pnpm install',
            options: { onlyIfChanged: ['file.txt'] },
            commandType: 'dependencies',
          },
          {
            command: 'custom',
            options: { onlyIfChanged: ['file2.txt'] },
            commandType: 'script',
          },
        ],
      },
      '/root',
      undefined,
      testLogger
    );
    expect(vol.toJSON()).toEqual({
      '/root/file.txt': 'hi',
      '/root/file2.txt': 'hello',
    });

    expect(mockedExecuteCommand.mock.calls[0][0]).toBe('custom');
    expect(mockedExecuteCommand).toHaveBeenCalledTimes(1);
  });

  it('should run post-write commands only on modified binary files', async () => {
    vol.fromJSON({
      '/root/file.txt': 'binary-data',
    });

    await writeGeneratorOutput(
      {
        files: {
          'file.txt': { contents: Buffer.from('binary-data', 'utf8') },
        },
        postWriteCommands: [
          {
            command: 'pnpm install',
            options: { onlyIfChanged: ['file.txt'] },
            commandType: 'dependencies',
          },
        ],
      },
      '/root',
      undefined,
      testLogger
    );
    expect(vol.toJSON()).toEqual({
      '/root/file.txt': 'binary-data',
    });

    expect(mockedExecuteCommand).toHaveBeenCalledTimes(0);
  });
});
