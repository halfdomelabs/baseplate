import childProcess from 'child_process';
import { vol } from 'memfs';
import { FormatterProvider } from '@src/providers';
import { writeGeneratorOutput } from './generator-output';

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
          'file2.txt': { contents: 'hello' },
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
  });
});
