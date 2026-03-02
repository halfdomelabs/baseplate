import { createPatch } from 'diff';
import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SnapshotManifest } from './snapshot-types.js';

import { createTestGeneratorOutput } from '../../tests/helpers/generator-output.test-helper.js';
import { applySnapshotToGeneratorOutput } from './apply-diff-to-generator-output.js';

vi.mock('node:fs/promises');

const DIFFS_DIR = '/snapshots/backend/diffs';

function emptyManifest(): SnapshotManifest {
  return { version: '1', files: { modified: [], added: [], deleted: [] } };
}

describe('applySnapshotToGeneratorOutput', () => {
  beforeEach(() => {
    vol.reset();
    vi.clearAllMocks();
  });

  it('should return unmodified output when snapshot has no changes', async () => {
    const generatorOutput = createTestGeneratorOutput({
      files: { 'src/index.ts': 'export const x = 1;' },
    });

    const result = await applySnapshotToGeneratorOutput(
      generatorOutput,
      emptyManifest(),
      DIFFS_DIR,
    );

    expect(result.files.get('src/index.ts')?.contents).toBe(
      'export const x = 1;',
    );
  });

  it('should apply patch to modified files', async () => {
    const original = 'export const x = 1;\n';
    const modified = 'export const x = 2;\n';
    const diff = createPatch('src/index.ts', original, modified);

    vol.fromJSON({
      [`${DIFFS_DIR}/src_index.ts.diff`]: diff,
    });

    const generatorOutput = createTestGeneratorOutput({
      files: { 'src/index.ts': original },
    });

    const snapshot: SnapshotManifest = {
      ...emptyManifest(),
      files: {
        modified: [{ path: 'src/index.ts', diffFile: 'src_index.ts.diff' }],
        added: [],
        deleted: [],
      },
    };

    const result = await applySnapshotToGeneratorOutput(
      generatorOutput,
      snapshot,
      DIFFS_DIR,
    );

    expect(result.files.get('src/index.ts')?.contents).toBe(modified);
  });

  it('should remove deleted files from output', async () => {
    const generatorOutput = createTestGeneratorOutput({
      files: {
        'src/index.ts': 'export const x = 1;',
        'src/removed.ts': 'export const gone = true;',
      },
    });

    const snapshot: SnapshotManifest = {
      ...emptyManifest(),
      files: {
        modified: [],
        added: [],
        deleted: ['src/removed.ts'],
      },
    };

    const result = await applySnapshotToGeneratorOutput(
      generatorOutput,
      snapshot,
      DIFFS_DIR,
    );

    expect(result.files.has('src/removed.ts')).toBe(false);
    expect(result.files.has('src/index.ts')).toBe(true);
  });

  it('should inject added files with stored content', async () => {
    vol.fromJSON({
      [`${DIFFS_DIR}/src_custom.ts.diff`]: 'export const custom = true;\n',
    });

    const generatorOutput = createTestGeneratorOutput({
      files: { 'src/index.ts': 'export const x = 1;' },
    });

    const snapshot: SnapshotManifest = {
      ...emptyManifest(),
      files: {
        modified: [],
        added: [{ path: 'src/custom.ts', contentFile: 'src_custom.ts.diff' }],
        deleted: [],
      },
    };

    const result = await applySnapshotToGeneratorOutput(
      generatorOutput,
      snapshot,
      DIFFS_DIR,
    );

    expect(result.files.get('src/custom.ts')?.contents).toBe(
      'export const custom = true;\n',
    );
  });

  it('should skip added files without contentFile (path-only entries)', async () => {
    const generatorOutput = createTestGeneratorOutput({
      files: { 'src/index.ts': 'export const x = 1;' },
    });

    const snapshot: SnapshotManifest = {
      ...emptyManifest(),
      files: {
        modified: [],
        added: [{ path: 'src/user-file.ts' }],
        deleted: [],
      },
    };

    const result = await applySnapshotToGeneratorOutput(
      generatorOutput,
      snapshot,
      DIFFS_DIR,
    );

    // Path-only entry should not be injected
    expect(result.files.has('src/user-file.ts')).toBe(false);
    expect(result.files.size).toBe(1);
  });

  it('should throw when modified file is not in generator output', async () => {
    vol.fromJSON({
      [`${DIFFS_DIR}/src_missing.ts.diff`]: 'some diff',
    });

    const generatorOutput = createTestGeneratorOutput({
      files: {},
    });

    const snapshot: SnapshotManifest = {
      ...emptyManifest(),
      files: {
        modified: [{ path: 'src/missing.ts', diffFile: 'src_missing.ts.diff' }],
        added: [],
        deleted: [],
      },
    };

    await expect(
      applySnapshotToGeneratorOutput(generatorOutput, snapshot, DIFFS_DIR),
    ).rejects.toThrow('File not found in generator output: src/missing.ts');
  });

  it('should throw when diff file is missing from disk', async () => {
    // No diff file written to vol
    const generatorOutput = createTestGeneratorOutput({
      files: { 'src/index.ts': 'export const x = 1;' },
    });

    const snapshot: SnapshotManifest = {
      ...emptyManifest(),
      files: {
        modified: [{ path: 'src/index.ts', diffFile: 'src_index.ts.diff' }],
        added: [],
        deleted: [],
      },
    };

    await expect(
      applySnapshotToGeneratorOutput(generatorOutput, snapshot, DIFFS_DIR),
    ).rejects.toThrow('Diff file not found');
  });

  it('should throw when patch fails to apply', async () => {
    // Create a diff against completely different content
    const diff = createPatch(
      'src/index.ts',
      'completely different original\nwith many lines\nthat do not match\n',
      'modified version\n',
    );

    vol.fromJSON({
      [`${DIFFS_DIR}/src_index.ts.diff`]: diff,
    });

    const generatorOutput = createTestGeneratorOutput({
      files: { 'src/index.ts': 'export const x = 1;\n' },
    });

    const snapshot: SnapshotManifest = {
      ...emptyManifest(),
      files: {
        modified: [{ path: 'src/index.ts', diffFile: 'src_index.ts.diff' }],
        added: [],
        deleted: [],
      },
    };

    await expect(
      applySnapshotToGeneratorOutput(generatorOutput, snapshot, DIFFS_DIR),
    ).rejects.toThrow('Failed to apply patch to file src/index.ts');
  });

  it('should handle mixed modified, added, and deleted files', async () => {
    const original = 'export const x = 1;\n';
    const modified = 'export const x = 2;\n';
    const diff = createPatch('src/index.ts', original, modified);

    vol.fromJSON({
      [`${DIFFS_DIR}/src_index.ts.diff`]: diff,
      [`${DIFFS_DIR}/src_new-file.ts.diff`]: 'export const newFile = true;\n',
    });

    const generatorOutput = createTestGeneratorOutput({
      files: {
        'src/index.ts': original,
        'src/removed.ts': 'gone',
        'src/untouched.ts': 'stays',
      },
    });

    const snapshot: SnapshotManifest = {
      ...emptyManifest(),
      files: {
        modified: [{ path: 'src/index.ts', diffFile: 'src_index.ts.diff' }],
        added: [
          {
            path: 'src/new-file.ts',
            contentFile: 'src_new-file.ts.diff',
          },
        ],
        deleted: ['src/removed.ts'],
      },
    };

    const result = await applySnapshotToGeneratorOutput(
      generatorOutput,
      snapshot,
      DIFFS_DIR,
    );

    expect(result.files.get('src/index.ts')?.contents).toBe(modified);
    expect(result.files.get('src/new-file.ts')?.contents).toBe(
      'export const newFile = true;\n',
    );
    expect(result.files.has('src/removed.ts')).toBe(false);
    expect(result.files.get('src/untouched.ts')?.contents).toBe('stays');
  });
});
