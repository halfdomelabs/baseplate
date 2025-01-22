import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GeneratorTaskOutputBuilder } from '@src/output/index.js';

import { copyDirectoryAction } from './copy-directory-action.js';

vi.mock('fs');
vi.mock('fs/promises');

beforeEach(() => {
  vol.reset();
});

describe('copyDirectoryAction', () => {
  it('should copy an empty directory', async () => {
    await vol.promises.mkdir('/generator/templates', { recursive: true });

    const builder = new GeneratorTaskOutputBuilder({
      generatorBaseDirectory: '/generator',
      generatorName: 'test',
    });

    await copyDirectoryAction({
      source: '/',
      destination: '/',
    }).execute(builder);

    expect(builder.output.files.size).toEqual(0);
    expect(builder.output.postWriteCommands).toHaveLength(0);
  });

  it('should copy files in a directory', async () => {
    vol.fromJSON({
      '/generator/templates/a/test1.txt': 'hi',
      '/generator/templates/a/nested/test2.txt': 'hi2',
    });

    const builder = new GeneratorTaskOutputBuilder({
      generatorBaseDirectory: '/generator',
      generatorName: 'test',
    });

    await copyDirectoryAction({
      source: '/a',
      destination: '/dest',
    }).execute(builder);

    expect(builder.output.files.size).toEqual(2);
    expect(builder.output.files.get('/dest/test1.txt')).toEqual({
      id: 'test:/dest/test1.txt',
      contents: Buffer.from('hi', 'utf8'),
    });
    expect(builder.output.files.get('/dest/nested/test2.txt')).toEqual({
      id: 'test:/dest/nested/test2.txt',
      contents: Buffer.from('hi2', 'utf8'),
    });
    expect(builder.output.postWriteCommands).toHaveLength(0);
  });

  it('should copy file with formatting', async () => {
    vol.fromJSON({
      '/generator/templates/test1.txt': 'hi',
    });

    const builder = new GeneratorTaskOutputBuilder({
      generatorBaseDirectory: '/generator',
      generatorName: 'test',
    });

    await copyDirectoryAction({
      source: '/',
      destination: '/dest',
      shouldFormat: true,
    }).execute(builder);

    expect(builder.output.files.size).toEqual(1);
    expect(builder.output.files.get('/dest/test1.txt')).toEqual({
      id: 'test:/dest/test1.txt',
      contents: 'hi',
      options: { shouldFormat: true },
    });
    expect(builder.output.postWriteCommands).toHaveLength(0);
  });
});
