import { vol } from 'memfs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TEMPLATE_METADATA_FILENAME } from '../constants.js';
import { readTemplateMetadataPaths } from './read-template-metadata-paths.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('readTemplateMetadataPaths', () => {
  const outputDirectory = '/test/output';

  beforeEach(() => {
    vol.reset();
    vi.clearAllMocks();
  });

  it('should find and return template paths', async () => {
    // mock file system
    vol.fromJSON({
      [path.join(outputDirectory, 'src', TEMPLATE_METADATA_FILENAME)]:
        JSON.stringify({
          'test-file.ts': {
            name: 'test-file',
            type: 'test-type',
            generator: 'test-generator',
            template: 'test-template.ts',
          },
          'test-file-2.ts': {
            name: 'test-file-2',
            type: 'test-type-2',
            generator: 'test-generator-2',
            template: 'test-template-2.ts',
          },
        }),
      [path.join(outputDirectory, 'src/folder', TEMPLATE_METADATA_FILENAME)]:
        JSON.stringify({
          'index.ts': {
            name: 'index-file',
            type: 'test-type',
            generator: 'test-generator',
            template: 'index-template.ts',
          },
        }),
    });

    const results = await readTemplateMetadataPaths(outputDirectory);

    expect(results).toEqual([
      'src/test-file.ts',
      'src/test-file-2.ts',
      'src/folder/index.ts',
    ]);
  });

  it('should return empty array when no metadata files found', async () => {
    const results = await readTemplateMetadataPaths(outputDirectory);
    expect(results).toEqual([]);
  });
});
