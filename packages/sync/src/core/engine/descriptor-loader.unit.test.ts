import { promises as fs } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

import { loadDescriptorFromFile } from './descriptor-loader.js';

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
  },
}));

const mockedFs = vi.mocked(fs);

describe('loadDescriptorFromFile', () => {
  it('loads simple descriptor', async () => {
    const descriptor = { generator: 'test-generator' };
    mockedFs.readFile.mockResolvedValue(JSON.stringify(descriptor));

    const loadedDescriptor = await loadDescriptorFromFile('/path/to/file');

    expect(loadedDescriptor).toEqual(descriptor);
  });

  it('fails with an invalid descriptor', async () => {
    const descriptor = { name: 'test-descriptors' };
    mockedFs.readFile.mockResolvedValue(JSON.stringify(descriptor));

    await expect(loadDescriptorFromFile('/path/to/file')).rejects.toThrow(
      'Unable to load descriptor file',
    );
  });
});
