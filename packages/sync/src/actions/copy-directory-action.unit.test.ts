import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OutputBuilder } from '../core/index.js';
import { copyDirectoryAction } from './copy-directory-action.js';

vi.mock('fs');
vi.mock('fs/promises');

beforeEach(() => {
  vol.reset();
});

describe('copyDirectoryAction', () => {
  const formatter = { format: vi.fn() };
  it('should copy an empty directory', async () => {
    await vol.promises.mkdir('/generator/templates', { recursive: true });

    const builder = new OutputBuilder('/generator');

    await copyDirectoryAction({ source: '/', destination: '/' }).execute(
      builder,
    );

    expect(builder.output.files).toEqual({});
    expect(builder.output.postWriteCommands).toHaveLength(0);
  });

  it('should copy files in a directory', async () => {
    vol.fromJSON({
      '/generator/templates/a/test1.txt': 'hi',
      '/generator/templates/a/nested/test2.txt': 'hi2',
    });

    const builder = new OutputBuilder('/generator');

    await copyDirectoryAction({
      source: '/a',
      destination: '/dest',
    }).execute(builder);

    expect(builder.output.files).toEqual({
      '/dest/test1.txt': { contents: Buffer.from('hi', 'utf8') },
      '/dest/nested/test2.txt': { contents: Buffer.from('hi2', 'utf8') },
    });
    expect(builder.output.postWriteCommands).toHaveLength(0);
  });

  it('should copy file with formatting', async () => {
    vol.fromJSON({
      '/generator/templates/test1.txt': 'hi',
    });

    const builder = new OutputBuilder('/generator', formatter);

    await copyDirectoryAction({
      source: '/',
      destination: '/dest',
      shouldFormat: true,
    }).execute(builder);

    expect(builder.output.files).toEqual({
      '/dest/test1.txt': {
        contents: 'hi',
        formatter,
        options: { shouldFormat: true },
      },
    });
    expect(builder.output.postWriteCommands).toHaveLength(0);
  });
});
