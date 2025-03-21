import type { PluginMetadataWithPaths } from '@halfdomelabs/project-builder-lib';
import type { Logger } from '@halfdomelabs/sync';

import { loadPluginsInPackage } from '@halfdomelabs/project-builder-lib/plugin-tools';
import { vol } from 'memfs';
import { createRequire } from 'node:module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { discoverPlugins } from './plugin-discovery.js';

// Mock the required modules
vi.mock('node:fs/promises');
vi.mock('@halfdomelabs/project-builder-lib/plugin-tools', () => ({
  loadPluginsInPackage: vi.fn(),
}));
vi.mock('node:module', () => ({
  createRequire: vi.fn(),
}));

describe('discoverPlugins', () => {
  const mockLogger: Logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  const mockRequire = {
    resolve: vi.fn(),
  };

  beforeEach(() => {
    vol.reset();
    vi.clearAllMocks();

    // Reset the createRequire mock
    vi.mocked(createRequire).mockReturnValue(
      mockRequire as unknown as NodeJS.Require,
    );
  });

  it('should discover plugins from package.json dependencies', async () => {
    // Arrange
    const projectDir = '/project';
    const pluginPath = '/project/node_modules/baseplate-plugin-test';

    // Setup virtual file system
    vol.fromJSON({
      '/project/package.json': JSON.stringify({
        dependencies: {
          'baseplate-plugin-test': '1.0.0',
          '@org/baseplate-plugin-other': '1.0.0',
          'non-plugin-package': '1.0.0',
        },
      }),
      [`${pluginPath}/package.json`]: JSON.stringify({
        name: 'baseplate-plugin-test',
      }),
    });

    // Mock require.resolve to return paths
    mockRequire.resolve.mockImplementation((packageName: string) => {
      if (packageName === 'baseplate-plugin-test') {
        return `${pluginPath}/index.js`;
      }
      if (packageName === '@org/baseplate-plugin-other') {
        return '/project/node_modules/@org/baseplate-plugin-other/index.js';
      }
      throw new Error(`Module not found: ${packageName}`);
    });

    // Mock loadPluginsInPackage to return some test data
    const mockPluginData: PluginMetadataWithPaths[] = [
      {
        id: 'test-plugin',
        packageName: 'baseplate-plugin-test',
        displayName: 'Test Plugin',
        description: 'A test plugin',
        version: '1.0.0',
        name: 'test-plugin',
        pluginDirectory: pluginPath,
        webBuildDirectory: '/project/node_modules/baseplate-plugin-test/dist',
        nodeModulePaths: ['/project/node_modules'],
        webModulePaths: ['/project/node_modules/baseplate-plugin-test/dist'],
      },
    ];
    vi.mocked(loadPluginsInPackage).mockResolvedValue(mockPluginData);

    // Act
    const result = await discoverPlugins(projectDir, mockLogger);

    // Assert
    expect(result).toEqual(mockPluginData);
    expect(loadPluginsInPackage).toHaveBeenCalledTimes(1);
    expect(loadPluginsInPackage).toHaveBeenCalledWith(
      pluginPath,
      'baseplate-plugin-test',
    );
  });

  it('should throw error when package.json is not found', async () => {
    // Arrange
    const projectDir = '/empty-project';

    // Act & Assert
    await expect(discoverPlugins(projectDir, mockLogger)).rejects.toThrow(
      'Could not find root package.json file for the Baseplate project',
    );
  });

  it('should throw error when package.json is invalid', async () => {
    // Arrange
    const projectDir = '/invalid-project';
    vol.fromJSON({
      '/invalid-project/package.json': 'invalid-json',
    });

    // Act & Assert
    await expect(discoverPlugins(projectDir, mockLogger)).rejects.toThrow(
      'Could not read the root package.json file',
    );
  });

  it('should handle missing plugin package.json gracefully', async () => {
    // Arrange
    const projectDir = '/project';

    vol.fromJSON({
      '/project/package.json': JSON.stringify({
        dependencies: {
          'baseplate-plugin-test': '1.0.0',
        },
      }),
    });

    mockRequire.resolve.mockReturnValue(
      '/project/node_modules/baseplate-plugin-test/index.js',
    );

    // Act
    const result = await discoverPlugins(projectDir, mockLogger);

    // Assert
    expect(result).toEqual([]);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Could not find package.json file for the plugin baseplate-plugin-test.',
    );
  });
});
