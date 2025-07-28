import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SnapshotDirectory, SnapshotManifest } from './snapshot-types.js';

import {
  initializeSnapshotManifest,
  loadSnapshotManifest,
  saveSnapshotManifest,
  snapshotManifestUtils,
} from './snapshot-manifest.js';
import { SNAPSHOT_VERSION } from './snapshot-types.js';

const { addAddedFile, addDeletedFile, addModifiedFile, removeFile } =
  snapshotManifestUtils;

vi.mock('node:fs/promises');

describe('snapshot-manifest', () => {
  let mockSnapshotDir: SnapshotDirectory;

  beforeEach(() => {
    vol.reset();
    vi.clearAllMocks();

    mockSnapshotDir = {
      path: '/test/.baseplate-snapshot',
      manifestPath: '/test/.baseplate-snapshot/manifest.json',
      diffsPath: '/test/.baseplate-snapshot/patches',
    };
  });

  describe('initializeSnapshotManifest', () => {
    it('should create a new manifest with correct structure', () => {
      const manifest = initializeSnapshotManifest();

      expect(manifest).toEqual({
        version: SNAPSHOT_VERSION,
        files: {
          modified: [],
          added: [],
          deleted: [],
        },
      });
    });
  });

  describe('saveSnapshotManifest', () => {
    it('should save manifest as formatted JSON', async () => {
      const manifest = initializeSnapshotManifest();
      const updatedManifest = addModifiedFile(
        manifest,
        'src/test.ts',
        'test.diff',
      );

      // Create the directory first
      vol.mkdirSync(mockSnapshotDir.path, { recursive: true });

      await saveSnapshotManifest(mockSnapshotDir, updatedManifest);

      const savedContent = vol.readFileSync(
        mockSnapshotDir.manifestPath,
        'utf8',
      ) as string;
      const parsed = JSON.parse(savedContent) as SnapshotManifest;

      expect(parsed).toEqual(updatedManifest);
      expect(savedContent).toContain('  '); // Check for formatting
    });
  });

  describe('loadSnapshotManifest', () => {
    it('should load a valid manifest', async () => {
      const manifest = initializeSnapshotManifest();
      const updatedManifest = addModifiedFile(
        manifest,
        'src/test.ts',
        'test.diff',
      );

      vol.fromJSON({
        [mockSnapshotDir.manifestPath]: JSON.stringify(updatedManifest),
      });

      const loaded = await loadSnapshotManifest(mockSnapshotDir);
      expect(loaded).toEqual(updatedManifest);
    });

    it('should return undefined for missing manifest', async () => {
      const loaded = await loadSnapshotManifest(mockSnapshotDir);
      expect(loaded).toBeUndefined();
    });
  });

  describe('snapshotManifestUtils', () => {
    describe('addModifiedFile', () => {
      it('should return new manifest with added file entry', () => {
        const originalManifest = initializeSnapshotManifest();
        const updatedManifest = addModifiedFile(
          originalManifest,
          'src/test.ts',
          'test.diff',
        );

        expect(updatedManifest.files.modified).toEqual([
          {
            path: 'src/test.ts',
            diffFile: 'test.diff',
          },
        ]);

        // Original manifest should be unchanged
        expect(originalManifest.files.modified).toEqual([]);
      });
    });

    describe('addAddedFile', () => {
      it('should return new manifest with added file', () => {
        const originalManifest = initializeSnapshotManifest();
        const updatedManifest = addAddedFile(originalManifest, 'src/new.ts');

        expect(updatedManifest.files.added).toEqual(['src/new.ts']);

        // Original manifest should be unchanged
        expect(originalManifest.files.added).toEqual([]);
      });
    });

    describe('addDeletedFile', () => {
      it('should return new manifest with deleted file', () => {
        const originalManifest = initializeSnapshotManifest();
        const updatedManifest = addDeletedFile(
          originalManifest,
          'src/removed.ts',
        );

        expect(updatedManifest.files.deleted).toEqual(['src/removed.ts']);

        // Original manifest should be unchanged
        expect(originalManifest.files.deleted).toEqual([]);
      });
    });

    describe('removeFile', () => {
      it('should remove files from all categories', () => {
        const manifest = initializeSnapshotManifest();
        let updatedManifest = addModifiedFile(
          manifest,
          'src/test.ts',
          'test.diff',
        );
        updatedManifest = addAddedFile(updatedManifest, 'src/added.ts');
        updatedManifest = addDeletedFile(updatedManifest, 'src/deleted.ts');

        const finalManifest = removeFile(updatedManifest, 'src/test.ts');

        expect(finalManifest.files.modified).toEqual([]);
        expect(finalManifest.files.added).toEqual(['src/added.ts']);
        expect(finalManifest.files.deleted).toEqual(['src/deleted.ts']);
      });
    });
  });
});
