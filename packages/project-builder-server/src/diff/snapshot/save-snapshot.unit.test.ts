import { vol } from 'memfs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SnapshotManifest } from './snapshot-types.js';

import { createTestGeneratorOutput } from '../../tests/helpers/generator-output.test-helper.js';
import { saveSnapshot } from './save-snapshot.js';
import {
  DIFFS_DIRNAME,
  MANIFEST_FILENAME,
  snapshotManifestSchema,
} from './snapshot-types.js';

vi.mock('node:fs/promises');
vi.mock('isbinaryfile');
vi.mock('globby');

const PROJECT_DIR = '/project';
const APP_DIR = '/project/apps/backend';
const APP_NAME = 'backend';

/**
 * Reads and parses the snapshot manifest from memfs at the given snapshot path.
 */
function readManifestFromVol(snapshotPath: string): SnapshotManifest {
  const files = vol.toJSON();
  const manifestPath = path.join(snapshotPath, MANIFEST_FILENAME);
  const raw = files[manifestPath];
  if (typeof raw !== 'string') {
    throw new TypeError(`Manifest not found at ${manifestPath}`);
  }
  return snapshotManifestSchema.parse(JSON.parse(raw));
}

describe('saveSnapshot', () => {
  beforeEach(async () => {
    vol.reset();
    vi.clearAllMocks();

    const { isBinaryFile } = await import('isbinaryfile');
    vi.mocked(isBinaryFile).mockResolvedValue(false);

    // Default: globby returns no working-only files
    const { globby } = await import('globby');
    vi.mocked(globby).mockResolvedValue([]);
  });

  it('should create snapshot with modified files', async () => {
    vol.fromJSON({
      [path.join(APP_DIR, 'src/index.ts')]:
        'export const x = 2; // user modified',
    });

    const generatorOutput = createTestGeneratorOutput({
      files: {
        'src/index.ts': 'export const x = 1;',
      },
    });

    const result = await saveSnapshot(
      APP_DIR,
      PROJECT_DIR,
      APP_NAME,
      generatorOutput,
    );

    expect(result.fileCount.modified).toBe(1);
    expect(result.fileCount.added).toBe(0);
    expect(result.fileCount.deleted).toBe(0);

    // Verify manifest was written and parsed correctly
    const manifest = readManifestFromVol(result.snapshotPath);
    expect(manifest.files.modified).toHaveLength(1);
    expect(manifest.files.modified[0].path).toBe('src/index.ts');

    // Verify diff file was written
    const files = vol.toJSON();
    const diffFilePath = path.join(
      result.snapshotPath,
      DIFFS_DIRNAME,
      manifest.files.modified[0].diffFile,
    );
    expect(files[diffFilePath]).toBeDefined();
  });

  it('should create snapshot with deleted files', async () => {
    // File exists in generator output but not in working directory
    const generatorOutput = createTestGeneratorOutput({
      files: {
        'src/removed.ts': 'export const gone = true;',
      },
    });

    const result = await saveSnapshot(
      APP_DIR,
      PROJECT_DIR,
      APP_NAME,
      generatorOutput,
    );

    expect(result.fileCount.deleted).toBe(1);

    const manifest = readManifestFromVol(result.snapshotPath);
    expect(manifest.files.deleted).toContain('src/removed.ts');
  });

  it('should create snapshot with added files (path only by default)', async () => {
    const { globby } = await import('globby');
    vi.mocked(globby).mockResolvedValue(['src/custom.ts']);

    vol.fromJSON({
      [path.join(APP_DIR, 'src/custom.ts')]: 'export const custom = true;',
    });

    // Generator output has no files — the working file is "added"
    const generatorOutput = createTestGeneratorOutput({
      files: {},
    });

    const result = await saveSnapshot(
      APP_DIR,
      PROJECT_DIR,
      APP_NAME,
      generatorOutput,
    );

    expect(result.fileCount.added).toBe(1);

    const manifest = readManifestFromVol(result.snapshotPath);
    expect(manifest.files.added).toHaveLength(1);
    expect(manifest.files.added[0].path).toBe('src/custom.ts');
    expect(manifest.files.added[0].contentFile).toBeUndefined();

    // Verify no content file was written in diffs/
    const files = vol.toJSON();
    const diffsDir = path.join(result.snapshotPath, DIFFS_DIRNAME);
    const diffsFiles = Object.keys(files).filter(
      (f) => f.startsWith(diffsDir) && f !== diffsDir,
    );
    expect(diffsFiles).toHaveLength(0);
  });

  it('should store added file contents when includeAddedFileContents is true', async () => {
    const { globby } = await import('globby');
    vi.mocked(globby).mockResolvedValue(['src/custom.ts']);

    vol.fromJSON({
      [path.join(APP_DIR, 'src/custom.ts')]: 'export const custom = true;',
    });

    const generatorOutput = createTestGeneratorOutput({
      files: {},
    });

    const result = await saveSnapshot(
      APP_DIR,
      PROJECT_DIR,
      APP_NAME,
      generatorOutput,
      { includeAddedFileContents: true },
    );

    expect(result.fileCount.added).toBe(1);

    const manifest = readManifestFromVol(result.snapshotPath);
    expect(manifest.files.added).toHaveLength(1);
    expect(manifest.files.added[0].path).toBe('src/custom.ts');

    // Verify content file was written
    const { contentFile } = manifest.files.added[0];
    if (!contentFile) {
      throw new Error('Expected contentFile to be defined');
    }

    const files = vol.toJSON();
    const contentFilePath = path.join(
      result.snapshotPath,
      DIFFS_DIRNAME,
      contentFile,
    );
    expect(files[contentFilePath]).toBe('export const custom = true;');
  });

  it('should create empty snapshot when no differences', async () => {
    vol.fromJSON({
      [path.join(APP_DIR, 'src/index.ts')]: 'export const x = 1;',
    });

    const generatorOutput = createTestGeneratorOutput({
      files: {
        'src/index.ts': 'export const x = 1;',
      },
    });

    const result = await saveSnapshot(
      APP_DIR,
      PROJECT_DIR,
      APP_NAME,
      generatorOutput,
    );

    expect(result.fileCount.modified).toBe(0);
    expect(result.fileCount.added).toBe(0);
    expect(result.fileCount.deleted).toBe(0);
  });

  it('should handle mixed modified, added, and deleted files', async () => {
    const { globby } = await import('globby');
    vi.mocked(globby).mockResolvedValue(['src/index.ts', 'src/custom.ts']);

    vol.fromJSON({
      [path.join(APP_DIR, 'src/index.ts')]: 'export const x = 2; // modified',
      [path.join(APP_DIR, 'src/custom.ts')]: 'export const custom = true;',
    });

    const generatorOutput = createTestGeneratorOutput({
      files: {
        'src/index.ts': 'export const x = 1;',
        'src/removed.ts': 'export const gone = true;',
      },
    });

    const result = await saveSnapshot(
      APP_DIR,
      PROJECT_DIR,
      APP_NAME,
      generatorOutput,
    );

    expect(result.fileCount.modified).toBe(1);
    expect(result.fileCount.added).toBe(1);
    expect(result.fileCount.deleted).toBe(1);
  });

  it('should use custom snapshot directory when provided', async () => {
    vol.fromJSON({
      [path.join(APP_DIR, 'src/index.ts')]: 'export const x = 2;',
    });

    const generatorOutput = createTestGeneratorOutput({
      files: {
        'src/index.ts': 'export const x = 1;',
      },
    });

    const customDir = 'custom/snapshots/backend';
    const result = await saveSnapshot(
      APP_DIR,
      PROJECT_DIR,
      APP_NAME,
      generatorOutput,
      { snapshotDir: customDir },
    );

    expect(result.snapshotPath).toBe(path.resolve(PROJECT_DIR, customDir));
  });
});
