import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ensureDir } from './ensure-dir.js';

vi.mock('node:fs/promises');

beforeEach(() => {
  vol.reset();
});

describe('ensureDir', () => {
  it('should create a directory if it does not exist', async () => {
    const dir = '/tmp/test-dir';
    await ensureDir(dir);

    expect(vol.existsSync(dir)).toBe(true);
  });

  it('should not create a directory if it already exists', async () => {
    const dir = '/tmp/test-dir';
    vol.fromJSON({
      [dir]: '',
    });
    await ensureDir(dir);
    expect(vol.existsSync(dir)).toBe(true);
  });
});
