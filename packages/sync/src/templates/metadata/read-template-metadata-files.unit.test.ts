import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readTemplateMetadataFiles } from './read-template-metadata-files.js';

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
        type: 'ts',
        name: 'auth-service',
        generator: '@auth/package#auth-module',
        template: 'services/auth.service.ts',
      },
      'user.service.ts': {
        type: 'ts',
        name: 'user-service',
        generator: '@auth/package#auth-module',
        template: 'services/user.service.ts',
      },
    };

    const metadata2 = {
      'config.ts': {
        type: 'text',
        name: 'config',
        generator: '@config/package#config-module',
        template: 'config.ts',
      },
    };

    const now = new Date('2024-01-01T00:00:00Z');
    const later = new Date('2024-01-02T00:00:00Z');

    vol.fromJSON({
      '/project/src/services/.template-metadata.json':
        JSON.stringify(metadata1),
      '/project/src/services/auth.service.ts': 'export class AuthService {}',
      '/project/src/services/user.service.ts': 'export class UserService {}',
      '/project/config/.template-metadata.json': JSON.stringify(metadata2),
      '/project/config/config.ts': 'export const config = {};',
    });

    // Set file modification times
    vol.utimesSync('/project/src/services/auth.service.ts', now, now);
    vol.utimesSync('/project/src/services/user.service.ts', later, later);
    vol.utimesSync('/project/config/config.ts', now, now);

    // Act
    const result = await readTemplateMetadataFiles('/project');

    // Assert
    expect(result).toHaveLength(3);

    // Check auth service entry
    const authEntry = result.find((e) => e.metadata.name === 'auth-service');
    expect(authEntry).toBeDefined();
    expect(authEntry?.path).toBe('/project/src/services/auth.service.ts');
    expect(authEntry?.metadata).toEqual(metadata1['auth.service.ts']);
    expect(authEntry?.modifiedTime).toEqual(now);

    // Check user service entry
    const userEntry = result.find((e) => e.metadata.name === 'user-service');
    expect(userEntry).toBeDefined();
    expect(userEntry?.path).toBe('/project/src/services/user.service.ts');
    expect(userEntry?.metadata).toEqual(metadata1['user.service.ts']);
    expect(userEntry?.modifiedTime).toEqual(later);

    // Check config entry
    const configEntry = result.find((e) => e.metadata.name === 'config');
    expect(configEntry).toBeDefined();
    expect(configEntry?.path).toBe('/project/config/config.ts');
    expect(configEntry?.metadata).toEqual(metadata2['config.ts']);
    expect(configEntry?.modifiedTime).toEqual(now);
  });

  it('should handle empty output directory', async () => {
    // Arrange
    vol.fromJSON({
      '/empty-project/package.json': '{}',
    });

    // Act
    const result = await readTemplateMetadataFiles('/empty-project');

    // Assert
    expect(result).toEqual([]);
  });

  it('should throw error when source file is missing', async () => {
    // Arrange
    const metadata = {
      'missing.ts': {
        type: 'ts',
        name: 'missing',
        generator: 'test#generator',
        template: 'missing.ts',
      },
    };

    vol.fromJSON({
      '/project/.template-metadata.json': JSON.stringify(metadata),
      // Note: missing.ts file is not created
    });

    // Act & Assert
    await expect(readTemplateMetadataFiles('/project')).rejects.toThrow(
      'Could not find source file (missing.ts) specified in metadata file: /project/.template-metadata.json',
    );
  });

  it('should handle invalid metadata file gracefully', async () => {
    // Arrange
    vol.fromJSON({
      '/project/.template-metadata.json': 'invalid json',
    });

    // Act & Assert
    await expect(readTemplateMetadataFiles('/project')).rejects.toThrow();
  });

  it('should validate metadata schema', async () => {
    // Arrange
    const invalidMetadata = {
      'test.ts': {
        type: 'ts',
        name: 'InvalidName', // Should be kebab-case
        generator: 'test#generator',
        template: 'test.ts',
      },
    };

    vol.fromJSON({
      '/project/.template-metadata.json': JSON.stringify(invalidMetadata),
      '/project/test.ts': 'export {};',
    });

    // Act & Assert
    await expect(readTemplateMetadataFiles('/project')).rejects.toThrow(
      'Must be kebab case',
    );
  });

  it('should handle nested metadata files', async () => {
    // Arrange
    const metadata1 = {
      'file1.ts': {
        type: 'ts',
        name: 'file-one',
        generator: 'test#generator',
        template: 'file1.ts',
      },
    };

    const metadata2 = {
      'file2.ts': {
        type: 'ts',
        name: 'file-two',
        generator: 'test#generator',
        template: 'file2.ts',
      },
    };

    vol.fromJSON({
      '/project/src/.template-metadata.json': JSON.stringify(metadata1),
      '/project/src/file1.ts': 'export const file1 = 1;',
      '/project/src/nested/deep/.template-metadata.json':
        JSON.stringify(metadata2),
      '/project/src/nested/deep/file2.ts': 'export const file2 = 2;',
    });

    // Act
    const result = await readTemplateMetadataFiles('/project');

    // Assert
    expect(result).toHaveLength(2);

    const paths = result.map((e) => e.path).sort();
    expect(paths).toEqual([
      '/project/src/file1.ts',
      '/project/src/nested/deep/file2.ts',
    ]);
  });

  it('should handle multiple files in single metadata file', async () => {
    // Arrange
    const metadata = {
      'file1.ts': {
        type: 'ts',
        name: 'file-one',
        generator: 'test#generator',
        template: 'templates/file1.ts',
      },
      'file2.ts': {
        type: 'text',
        name: 'file-two',
        generator: 'test#generator',
        template: 'templates/file2.ts',
      },
      'subdir/file3.ts': {
        type: 'ts',
        name: 'file-three',
        generator: 'test#generator',
        template: 'templates/file3.ts',
      },
    };

    vol.fromJSON({
      '/project/.template-metadata.json': JSON.stringify(metadata),
      '/project/file1.ts': 'export const file1 = 1;',
      '/project/file2.ts': 'export const file2 = 2;',
      '/project/subdir/file3.ts': 'export const file3 = 3;',
    });

    // Act
    const result = await readTemplateMetadataFiles('/project');

    // Assert
    expect(result).toHaveLength(3);

    const names = result.map((e) => e.metadata.name).sort();
    expect(names).toEqual(['file-one', 'file-three', 'file-two']);
  });
});
