import { vol } from 'memfs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  assertNotStale,
  writeGenerationManifest,
} from './generation-manifest.js';

vi.mock('node:fs/promises');

const TEST_DIR = '/test/project';

interface ManifestJson {
  generatedAt: string;
  files: Record<string, string>;
}

function readManifestFromVol(): ManifestJson {
  const files = vol.toJSON();
  const manifestPath = path.join(TEST_DIR, '.generation-manifest.json');
  const content = files[manifestPath];
  if (typeof content !== 'string') {
    throw new TypeError(`Manifest not found at ${manifestPath}`);
  }
  return JSON.parse(content) as ManifestJson;
}

describe('generation-manifest', () => {
  beforeEach(() => {
    vol.reset();
    vi.clearAllMocks();
  });

  describe('writeGenerationManifest', () => {
    it('should write a manifest file with file hashes', async () => {
      vol.fromJSON({
        [path.join(TEST_DIR, 'src/index.ts')]: 'console.info("hello");',
        [path.join(TEST_DIR, 'package.json')]: '{"name": "test"}',
      });

      await writeGenerationManifest(TEST_DIR);

      const manifest = readManifestFromVol();
      expect(manifest.generatedAt).toBeDefined();
      expect(Object.keys(manifest.files)).toHaveLength(2);
      expect(manifest.files['src/index.ts']).toBeDefined();
      expect(manifest.files['package.json']).toBeDefined();
      // Hashes should be 64-char hex strings (SHA-256)
      expect(manifest.files['src/index.ts']).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should skip node_modules and baseplate directories', async () => {
      vol.fromJSON({
        [path.join(TEST_DIR, 'src/index.ts')]: 'code',
        [path.join(TEST_DIR, 'node_modules/pkg/index.js')]: 'module code',
        [path.join(TEST_DIR, 'baseplate/project-definition.json')]: '{}',
      });

      await writeGenerationManifest(TEST_DIR);

      const manifest = readManifestFromVol();
      expect(Object.keys(manifest.files)).toEqual(['src/index.ts']);
    });

    it('should not include the manifest file itself', async () => {
      vol.fromJSON({
        [path.join(TEST_DIR, 'src/index.ts')]: 'code',
        [path.join(TEST_DIR, '.generation-manifest.json')]:
          '{"old": "manifest"}',
      });

      await writeGenerationManifest(TEST_DIR);

      const manifest = readManifestFromVol();
      expect(Object.keys(manifest.files)).toEqual(['src/index.ts']);
    });
  });

  describe('assertNotStale', () => {
    it('should not throw when no manifest exists', async () => {
      vol.fromJSON({
        [path.join(TEST_DIR, 'src/index.ts')]: 'code',
      });

      await expect(assertNotStale(TEST_DIR)).resolves.toBeUndefined();
    });

    it('should not throw when files are unchanged', async () => {
      vol.fromJSON({
        [path.join(TEST_DIR, 'src/index.ts')]: 'code',
        [path.join(TEST_DIR, 'package.json')]: '{}',
      });

      await writeGenerationManifest(TEST_DIR);
      await expect(assertNotStale(TEST_DIR)).resolves.toBeUndefined();
    });

    it('should throw when a file is modified', async () => {
      vol.fromJSON({
        [path.join(TEST_DIR, 'src/index.ts')]: 'original',
      });

      await writeGenerationManifest(TEST_DIR);

      // Modify the file
      vol.fromJSON(
        {
          [path.join(TEST_DIR, 'src/index.ts')]: 'modified',
        },
        undefined,
        // Do not reset the volume — merge with existing
      );

      await expect(assertNotStale(TEST_DIR)).rejects.toThrow(
        'src/index.ts (modified)',
      );
    });

    it('should throw when a new file is added', async () => {
      vol.fromJSON({
        [path.join(TEST_DIR, 'src/index.ts')]: 'code',
      });

      await writeGenerationManifest(TEST_DIR);

      // Add a new file (merge with existing)
      vol.fromJSON(
        {
          [path.join(TEST_DIR, 'src/new-file.ts')]: 'new code',
        },
        undefined,
      );

      await expect(assertNotStale(TEST_DIR)).rejects.toThrow(
        'src/new-file.ts (new)',
      );
    });

    it('should throw when a file is deleted', async () => {
      vol.fromJSON({
        [path.join(TEST_DIR, 'src/index.ts')]: 'code',
        [path.join(TEST_DIR, 'src/other.ts')]: 'other',
      });

      await writeGenerationManifest(TEST_DIR);

      // Delete a file by rewriting vol without it (keep manifest)
      const manifest = readManifestFromVol();
      vol.reset();
      vol.fromJSON({
        [path.join(TEST_DIR, 'src/index.ts')]: 'code',
        [path.join(TEST_DIR, '.generation-manifest.json')]:
          JSON.stringify(manifest),
      });

      await expect(assertNotStale(TEST_DIR)).rejects.toThrow(
        'src/other.ts (deleted)',
      );
    });
  });
});
