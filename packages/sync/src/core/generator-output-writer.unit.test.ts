import childProcess from 'child_process';
import { vol } from 'memfs';
import { FormatterProvider } from '@src/providers';
import { writeGeneratorOutput } from './generator-output-writer';

jest.mock('fs');

jest.mock('child_process');

const mockedChildProcess = jest.mocked(childProcess);

// tricky to properly mock exec

// eslint-disable-next-line @typescript-eslint/no-explicit-any
mockedChildProcess.exec.mockImplementation((...args): any => {
  (args[args.length - 1] as unknown as () => void)();
});

beforeEach(() => {
  vol.reset();
});

describe('writeGeneratorOutput', () => {
  it('should write nothing with a blank output', async () => {
    await writeGeneratorOutput({ files: {}, postWriteCommands: [] }, '/root');
    expect(vol.toJSON()).toEqual({});
  });

  it('should write files only', async () => {
    const formatFunction = jest.fn().mockResolvedValue('formatted-output');
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
      '/root'
    );
    expect(vol.toJSON()).toEqual({
      '/root/file.txt': 'hi',
      '/root/formatted.txt': 'formatted-output',
    });
    expect(formatFunction).toHaveBeenCalledWith('hello', '/root/formatted.txt');
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
              cleanContents: ['hello', 'hi', 'something', 'bye'].join('\n'),
            },
          },
          'file2.txt': {
            contents: ['123', '456', '789', '012'].join('\n'),
            options: {
              cleanContents: ['123', '456', '789', '012'].join('\n'),
            },
          },
        },
        postWriteCommands: [],
      },
      '/root'
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
              cleanContents: ['hello', 'hola', 'something', 'bye'].join('\n'),
            },
          },
        },
        postWriteCommands: [],
      },
      '/root'
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
      '/root'
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
      '/root'
    );
    expect(vol.toJSON()).toEqual({ '/root/file.txt': 'hi' });
  });

  it('should write binary file', async () => {
    await writeGeneratorOutput(
      {
        files: { 'file.txt': { contents: Buffer.from('hi', 'utf8') } },
        postWriteCommands: [],
      },
      '/root'
    );
    expect(vol.toJSON()).toEqual({ '/root/file.txt': 'hi' });
  });

  it('should run post-write commands', async () => {
    await writeGeneratorOutput(
      {
        files: {},
        postWriteCommands: [
          { command: 'yarn install' },
          { command: 'custom', options: { workingDirectory: '/folder' } },
        ],
      },
      '/root'
    );
    expect(vol.toJSON()).toEqual({});

    expect(mockedChildProcess.exec.mock.calls[0][0]).toBe('yarn install');
    expect(mockedChildProcess.exec.mock.calls[1][0]).toBe('custom');
    expect(mockedChildProcess.exec.mock.calls[1][1]).toMatchObject({
      cwd: '/root/folder',
    });
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
          'file2.txt': { contents: 'hello', options: { cleanContents: 'hi2' } },
        },
        postWriteCommands: [
          {
            command: 'yarn install',
            options: { onlyIfChanged: ['file.txt'] },
          },
          { command: 'custom', options: { onlyIfChanged: ['file2.txt'] } },
        ],
      },
      '/root'
    );
    expect(vol.toJSON()).toEqual({
      '/root/file.txt': 'hi',
      '/root/file2.txt': 'hello',
    });

    expect(mockedChildProcess.exec.mock.calls[0][0]).toBe('custom');
    expect(mockedChildProcess.exec).toHaveBeenCalledTimes(1);
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
          { command: 'yarn install', options: { onlyIfChanged: ['file.txt'] } },
        ],
      },
      '/root'
    );
    expect(vol.toJSON()).toEqual({
      '/root/file.txt': 'binary-data',
    });

    expect(mockedChildProcess.exec).toHaveBeenCalledTimes(0);
  });
});
