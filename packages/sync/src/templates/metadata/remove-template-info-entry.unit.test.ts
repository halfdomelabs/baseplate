import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { removeTemplateInfoEntry } from './remove-template-info-entry.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('removeTemplateInfoEntry', () => {
  beforeEach(() => {
    vol.reset();
    vi.clearAllMocks();
  });

  it('should remove a single entry from metadata file', async () => {
    // Arrange
    const metadata = {
      'file1.ts': {
        generator: 'test#generator',
        template: 'file-one',
      },
      'file2.ts': {
        generator: 'test#generator',
        template: 'file-two',
      },
    };

    vol.fromJSON({
      '/project/.templates-info.json': JSON.stringify(metadata),
    });

    // Act
    await removeTemplateInfoEntry('/project/.templates-info.json', 'file1.ts');

    // Assert
    const result = JSON.parse(
      vol.readFileSync('/project/.templates-info.json', 'utf8') as string,
    ) as Record<string, unknown>;
    expect(result).toEqual({
      'file2.ts': {
        generator: 'test#generator',
        template: 'file-two',
      },
    });
  });

  it('should delete metadata file when last entry is removed', async () => {
    // Arrange
    const metadata = {
      'file1.ts': {
        generator: 'test#generator',
        template: 'file-one',
      },
    };

    vol.fromJSON({
      '/project/.templates-info.json': JSON.stringify(metadata),
    });

    // Act
    await removeTemplateInfoEntry('/project/.templates-info.json', 'file1.ts');

    // Assert
    expect(vol.existsSync('/project/.templates-info.json')).toBe(false);
  });

  it('should handle non-existent metadata file gracefully', async () => {
    // Arrange
    vol.fromJSON({
      '/project/package.json': '{}',
    });

    // Act & Assert - should not throw
    await expect(
      removeTemplateInfoEntry('/project/.templates-info.json', 'file1.ts'),
    ).resolves.toBeUndefined();
  });

  it('should handle removing non-existent entry gracefully', async () => {
    // Arrange
    const metadata = {
      'file1.ts': {
        generator: 'test#generator',
        template: 'file-one',
      },
    };

    vol.fromJSON({
      '/project/.templates-info.json': JSON.stringify(metadata),
    });

    // Act
    await removeTemplateInfoEntry(
      '/project/.templates-info.json',
      'non-existent.ts',
    );

    // Assert - file should remain unchanged
    const result = JSON.parse(
      vol.readFileSync('/project/.templates-info.json', 'utf8') as string,
    ) as Record<string, unknown>;
    expect(result).toEqual(metadata);
  });
});
