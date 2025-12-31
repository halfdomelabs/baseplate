import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readTemplateInfoFiles } from './read-template-info-files.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('readTemplateMetadataFiles', () => {
  beforeEach(() => {
    vol.reset();
    vi.clearAllMocks();
  });

  it('should read template metadata files and return entries with file info', async () => {
    // Arrange
    const metadata1 = {
      'auth.service.ts': {
        generator: '@auth/package#auth-module',
        template: 'auth-service',
      },
      'user.service.ts': {
        generator: '@auth/package#auth-module',
        template: 'user-service',
      },
    };

    const metadata2 = {
      'config.ts': {
        generator: '@config/package#config-module',
        template: 'config',
      },
    };

    const now = new Date('2024-01-01T00:00:00Z');
    const later = new Date('2024-01-02T00:00:00Z');

    vol.fromJSON({
      '/project/src/services/.templates-info.json': JSON.stringify(metadata1),
      '/project/src/services/auth.service.ts': 'export class AuthService {}',
      '/project/src/services/user.service.ts': 'export class UserService {}',
      '/project/config/.templates-info.json': JSON.stringify(metadata2),
      '/project/config/config.ts': 'export const config = {};',
    });

    // Set file modification times
    vol.utimesSync('/project/src/services/auth.service.ts', now, now);
    vol.utimesSync('/project/src/services/user.service.ts', later, later);
    vol.utimesSync('/project/config/config.ts', now, now);

    // Act
    const result = await readTemplateInfoFiles('/project');

    // Assert
    expect(result.entries).toHaveLength(3);
    expect(result.orphanedEntries).toHaveLength(0);

    // Check auth service entry
    const authEntry = result.entries.find(
      (e) => e.templateInfo.template === 'auth-service',
    );
    expect(authEntry).toBeDefined();
    expect(authEntry?.absolutePath).toBe(
      '/project/src/services/auth.service.ts',
    );
    expect(authEntry?.templateInfo).toEqual(metadata1['auth.service.ts']);
    expect(authEntry?.modifiedTime).toEqual(now);

    // Check user service entry
    const userEntry = result.entries.find(
      (e) => e.templateInfo.template === 'user-service',
    );
    expect(userEntry).toBeDefined();
    expect(userEntry?.absolutePath).toBe(
      '/project/src/services/user.service.ts',
    );
    expect(userEntry?.templateInfo).toEqual(metadata1['user.service.ts']);
    expect(userEntry?.modifiedTime).toEqual(later);

    // Check config entry
    const configEntry = result.entries.find(
      (e) => e.templateInfo.template === 'config',
    );
    expect(configEntry).toBeDefined();
    expect(configEntry?.absolutePath).toBe('/project/config/config.ts');
    expect(configEntry?.templateInfo).toEqual(metadata2['config.ts']);
    expect(configEntry?.modifiedTime).toEqual(now);
  });

  it('should handle empty output directory', async () => {
    // Arrange
    vol.fromJSON({
      '/empty-project/package.json': '{}',
    });

    // Act
    const result = await readTemplateInfoFiles('/empty-project');

    // Assert
    expect(result.entries).toEqual([]);
    expect(result.orphanedEntries).toEqual([]);
  });

  it('should return orphaned entry when source file is missing', async () => {
    // Arrange
    const metadata = {
      'missing.ts': {
        generator: 'test#generator',
        template: 'missing',
      },
    };

    vol.fromJSON({
      '/project/.templates-info.json': JSON.stringify(metadata),
      // Note: missing.ts file is not created
    });

    // Act
    const result = await readTemplateInfoFiles('/project');

    // Assert
    expect(result.entries).toHaveLength(0);
    expect(result.orphanedEntries).toHaveLength(1);
    expect(result.orphanedEntries[0]).toEqual({
      absolutePath: '/project/missing.ts',
      templateInfo: metadata['missing.ts'],
      metadataFilePath: '/project/.templates-info.json',
      fileName: 'missing.ts',
    });
  });

  it('should handle invalid metadata file gracefully', async () => {
    // Arrange
    vol.fromJSON({
      '/project/.templates-info.json': 'invalid json',
    });

    // Act & Assert
    await expect(readTemplateInfoFiles('/project')).rejects.toThrow();
  });

  it('should validate metadata schema', async () => {
    // Arrange
    const invalidMetadata = {
      'test.ts': {
        generator: 'test#generator',
        template: 'invalid-name!',
      },
    };

    vol.fromJSON({
      '/project/.templates-info.json': JSON.stringify(invalidMetadata),
      '/project/test.ts': 'export {};',
    });

    // Act & Assert
    await expect(readTemplateInfoFiles('/project')).rejects.toThrow(
      'Must be kebab case',
    );
  });

  it('should handle nested metadata files', async () => {
    // Arrange
    const metadata1 = {
      'file1.ts': {
        generator: 'test#generator',
        template: 'file-1',
      },
    };

    const metadata2 = {
      'file2.ts': {
        generator: 'test#generator',
        template: 'file-2',
      },
    };

    vol.fromJSON({
      '/project/src/.templates-info.json': JSON.stringify(metadata1),
      '/project/src/file1.ts': 'export const file1 = 1;',
      '/project/src/nested/deep/.templates-info.json':
        JSON.stringify(metadata2),
      '/project/src/nested/deep/file2.ts': 'export const file2 = 2;',
    });

    // Act
    const result = await readTemplateInfoFiles('/project');

    // Assert
    expect(result.entries).toHaveLength(2);
    expect(result.orphanedEntries).toHaveLength(0);

    const paths = result.entries.map((e) => e.absolutePath).sort();
    expect(paths).toEqual([
      '/project/src/file1.ts',
      '/project/src/nested/deep/file2.ts',
    ]);
  });

  it('should handle multiple files in single metadata file', async () => {
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
      'subdir/file3.ts': {
        generator: 'test#generator',
        template: 'file-three',
      },
    };

    vol.fromJSON({
      '/project/.templates-info.json': JSON.stringify(metadata),
      '/project/file1.ts': 'export const file1 = 1;',
      '/project/file2.ts': 'export const file2 = 2;',
      '/project/subdir/file3.ts': 'export const file3 = 3;',
    });

    // Act
    const result = await readTemplateInfoFiles('/project');

    // Assert
    expect(result.entries).toHaveLength(3);
    expect(result.orphanedEntries).toHaveLength(0);

    const names = result.entries.map((e) => e.templateInfo.template).sort();
    expect(names).toEqual(['file-one', 'file-three', 'file-two']);
  });
});
