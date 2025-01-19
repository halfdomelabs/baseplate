import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { executeCommand } from '../utils/exec.js';
import { createEventedLogger } from '../utils/index.js';
import { POST_WRITE_COMMAND_PRIORITY } from './post-write-commands/index.js';
import { writeGeneratorOutput } from './write-generator-output.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

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
      { files: new Map(), postWriteCommands: [], globalFormatters: [] },
      '/root',
      undefined,
      testLogger,
    );
    expect(vol.toJSON()).toEqual({});
  });

  it('should write files only', async () => {
    const formatFunction = vi.fn().mockResolvedValue('formatted-output');
    await writeGeneratorOutput(
      {
        files: new Map([
          ['file.txt', { id: 'file', contents: 'hi' }],
          [
            'formatted.txt',
            {
              id: 'formatted',
              contents: 'hello',
              options: { shouldFormat: true },
            },
          ],
        ]),
        postWriteCommands: [],
        globalFormatters: [
          {
            name: 'test',
            format: formatFunction,
            fileExtensions: ['.txt'],
          },
        ],
      },
      '/root',
      undefined,
      testLogger,
    );
    expect(vol.toJSON()).toEqual({
      '/root/file.txt': 'hi',
      '/root/formatted.txt': 'formatted-output',
    });
    expect(formatFunction).toHaveBeenCalledWith(
      'hello',
      '/root/formatted.txt',
      testLogger,
    );
  });

  it('should perform 3-way merge', async () => {
    vol.fromJSON({
      '/root/file.txt': ['hello', 'bonjour', 'something', 'bye'].join('\n'),
      '/root/file2.txt': ['abc', 'def', 'ghi', 'jki'].join('\n'),
    });

    await writeGeneratorOutput(
      {
        files: new Map([
          [
            'file.txt',
            {
              id: 'file',
              contents: ['hello', 'hi', 'something', 'adios'].join('\n'),
              options: {
                cleanContents: Buffer.from(
                  ['hello', 'hi', 'something', 'bye'].join('\n'),
                ),
              },
            },
          ],
          [
            'file2.txt',
            {
              id: 'file2',
              contents: ['123', '456', '789', '012'].join('\n'),
              options: {
                cleanContents: Buffer.from(
                  ['123', '456', '789', '012'].join('\n'),
                ),
              },
            },
          ],
        ]),
        postWriteCommands: [],
        globalFormatters: [],
      },
      '/root',
      {},
      testLogger,
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
        files: new Map([
          [
            'file.txt',
            {
              id: 'file',
              contents: ['hello', 'hi', 'something', 'adios'].join('\n'),
              options: {
                cleanContents: Buffer.from(
                  ['hello', 'hola', 'something', 'bye'].join('\n'),
                ),
              },
            },
          ],
        ]),
        postWriteCommands: [],
        globalFormatters: [],
      },
      '/root',
      undefined,
      testLogger,
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
        files: new Map([
          [
            'file.txt',
            {
              id: 'file',
              contents: ['hello', 'hi', 'something', 'adios'].join('\n'),
            },
          ],
        ]),
        postWriteCommands: [],
        globalFormatters: [],
      },
      '/root',
      undefined,
      testLogger,
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
        files: new Map([
          [
            'file.txt',
            {
              id: 'file',
              contents: 'hi2',
              options: { neverOverwrite: true },
            },
          ],
        ]),
        postWriteCommands: [],
        globalFormatters: [],
      },
      '/root',
      undefined,
      testLogger,
    );
    expect(vol.toJSON()).toEqual({ '/root/file.txt': 'hi' });
  });

  it('should write binary file', async () => {
    await writeGeneratorOutput(
      {
        files: new Map([
          ['file.txt', { id: 'file', contents: Buffer.from('hi', 'utf8') }],
        ]),
        postWriteCommands: [],
        globalFormatters: [],
      },
      '/root',
      undefined,
      testLogger,
    );
    expect(vol.toJSON()).toEqual({ '/root/file.txt': 'hi' });
  });

  it('should run post-write commands in correct order', async () => {
    await writeGeneratorOutput(
      {
        files: new Map(),
        postWriteCommands: [
          {
            command: 'custom-script',
            options: {
              workingDirectory: '/folder',
              priority: POST_WRITE_COMMAND_PRIORITY.DEFAULT,
            },
          },
          {
            command: 'custom',
            options: {
              workingDirectory: '/folder',
              priority: POST_WRITE_COMMAND_PRIORITY.CODEGEN,
            },
          },
          {
            command: 'pnpm install',
            options: {
              workingDirectory: '/folder',
              priority: POST_WRITE_COMMAND_PRIORITY.DEPENDENCIES,
            },
          },
        ],
        globalFormatters: [],
      },
      '/root',
      undefined,
      testLogger,
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
        files: new Map([
          ['file.txt', { id: 'file', contents: 'hi' }],
          [
            'file2.txt',
            {
              id: 'file2',
              contents: 'hello',
              options: { cleanContents: Buffer.from('hi2') },
            },
          ],
        ]),
        postWriteCommands: [
          {
            command: 'pnpm install',
            options: {
              onlyIfChanged: ['file.txt'],
              priority: POST_WRITE_COMMAND_PRIORITY.DEPENDENCIES,
            },
          },
          {
            command: 'custom',
            options: {
              onlyIfChanged: ['file2.txt'],
              priority: POST_WRITE_COMMAND_PRIORITY.CODEGEN,
            },
          },
        ],
        globalFormatters: [],
      },
      '/root',
      undefined,
      testLogger,
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
        files: new Map([
          [
            'file.txt',
            { id: 'file', contents: Buffer.from('binary-data', 'utf8') },
          ],
        ]),
        postWriteCommands: [
          {
            command: 'pnpm install',
            options: {
              onlyIfChanged: ['file.txt'],
              priority: POST_WRITE_COMMAND_PRIORITY.DEPENDENCIES,
            },
          },
        ],
        globalFormatters: [],
      },
      '/root',
      undefined,
      testLogger,
    );
    expect(vol.toJSON()).toEqual({
      '/root/file.txt': 'binary-data',
    });

    expect(mockedExecuteCommand).toHaveBeenCalledTimes(0);
  });
});
