import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getPreviousGeneratedFileIdMap,
  writeGeneratedFileIdMap,
} from './file-id-map.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('file-id-map', () => {
  beforeEach(() => {
    vol.reset();
  });

  describe('getPreviousGeneratedFileIdMap', () => {
    it('should return a Map from existing file ID map', async () => {
      vol.fromJSON({
        'test-project/baseplate/file-id-map.json': JSON.stringify({
          file1: 'path/to/file1.ts',
          file2: 'path/to/file2.ts',
        }),
      });

      const result = await getPreviousGeneratedFileIdMap('test-project');

      expect(result).toBeInstanceOf(Map);
      expect(result.get('file1')).toBe('path/to/file1.ts');
      expect(result.get('file2')).toBe('path/to/file2.ts');
    });

    it('should return empty Map when file does not exist', async () => {
      const result = await getPreviousGeneratedFileIdMap('test-project');

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });
  });

  describe('writeGeneratedFileIdMap', () => {
    it('should write sorted file ID map to JSON file', async () => {
      const fileIdMap = new Map([
        ['file2', 'path/to/file2.ts'],
        ['file1', 'path/to/file1.ts'],
        ['file3', 'path/to/file3.ts'],
      ]);

      await writeGeneratedFileIdMap('test-project', fileIdMap);

      const files = vol.toJSON();
      const fileContent = files['test-project/baseplate/file-id-map.json'];

      const writtenContent = JSON.parse(fileContent ?? '') as Record<
        string,
        string
      >;
      expect(writtenContent).toEqual({
        file1: 'path/to/file1.ts',
        file2: 'path/to/file2.ts',
        file3: 'path/to/file3.ts',
      });
    });
  });
});
