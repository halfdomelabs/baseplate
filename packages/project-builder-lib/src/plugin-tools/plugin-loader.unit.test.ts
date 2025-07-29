import { vol } from 'memfs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PluginMetadata } from '../plugins/index.js';

import {
  getModuleFederationTargets,
  loadPluginsInPackage,
  PluginLoaderError,
} from './plugin-loader.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('plugin-loader', () => {
  beforeEach(() => {
    vol.reset();
  });

  describe('loadPluginsInPackage', () => {
    it('should load plugins with default configuration', async () => {
      // Arrange
      const mockPackageDirectory = '/test/plugin-package';
      const mockPackageName = '@test/plugin-example';

      const pluginMetadata: PluginMetadata = {
        name: 'test-plugin',
        displayName: 'Test Plugin',
        description: 'A test plugin',
        version: '1.0.0',
      };

      // Set up file system with package.json and plugin.json
      vol.fromJSON({
        '/test/plugin-package/package.json': JSON.stringify({
          name: mockPackageName,
        }),
        '/test/plugin-package/dist/test-plugin/plugin.json':
          JSON.stringify(pluginMetadata),
        '/test/plugin-package/dist/test-plugin/web.ts': 'export default {};',
        '/test/plugin-package/dist/test-plugin/common.ts': 'export default {};',
      });

      // Act
      const result = await loadPluginsInPackage(
        mockPackageDirectory,
        mockPackageName,
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          name: 'test-plugin',
          displayName: 'Test Plugin',
          key: `test_plugin-example_test-plugin`,
          fullyQualifiedName: '@test/plugin-example:test-plugin',
          packageName: mockPackageName,
          pluginDirectory: path.join(mockPackageDirectory, 'dist/test-plugin'),
          webBuildDirectory: path.join(mockPackageDirectory, 'dist/web'),
        }),
      );
    });

    it('should use package.json baseplate configuration', async () => {
      // Arrange
      const mockPackageDirectory = '/test/custom-package';
      const mockPackageName = '@test/custom-package';

      const pluginMetadata: PluginMetadata = {
        name: 'custom-plugin',
        displayName: 'Custom Plugin',
        description: 'A custom plugin',
        version: '1.0.0',
      };

      // Set up file system with custom baseplate config
      vol.fromJSON({
        '/test/custom-package/package.json': JSON.stringify({
          name: mockPackageName,
          baseplate: {
            pluginGlobs: ['custom/*/plugin.json'],
            webBuildDirectory: 'build/web',
          },
        }),
        '/test/custom-package/custom/custom-plugin/plugin.json':
          JSON.stringify(pluginMetadata),
        '/test/custom-package/custom/custom-plugin/web.ts':
          'export default {};',
        '/test/custom-package/custom/custom-plugin/common.ts':
          'export default {};',
      });

      // Act
      const result = await loadPluginsInPackage(
        mockPackageDirectory,
        mockPackageName,
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          name: 'custom-plugin',
          key: `test_custom-package_custom-plugin`,
          fullyQualifiedName: '@test/custom-package:custom-plugin',
          pluginDirectory: path.join(
            mockPackageDirectory,
            'custom/custom-plugin',
          ),
          webBuildDirectory: path.join(mockPackageDirectory, 'build/web'),
        }),
      );
    });

    it('should allow options to override package configuration', async () => {
      // Arrange
      const mockPackageDirectory = '/test/override-package';
      const mockPackageName = '@test/override-package';

      const pluginMetadata: PluginMetadata = {
        name: 'override-plugin',
        displayName: 'Override Plugin',
        description: 'An override plugin',
        version: '1.0.0',
      };

      // Set up file system with package config that will be overridden
      vol.fromJSON({
        '/test/override-package/package.json': JSON.stringify({
          name: mockPackageName,
          baseplate: {
            pluginGlobs: ['default/*/plugin.json'],
          },
        }),
        '/test/override-package/src/override-plugin/plugin.json':
          JSON.stringify(pluginMetadata),
        '/test/override-package/src/override-plugin/web.ts':
          'export default {};',
        '/test/override-package/src/override-plugin/common.ts':
          'export default {};',
      });

      // Act - override with options
      const result = await loadPluginsInPackage(
        mockPackageDirectory,
        mockPackageName,
        {
          pluginGlobs: ['src/*/plugin.json'],
        },
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('override-plugin');
    });

    it('should throw PluginLoaderError when no plugins found', async () => {
      // Arrange
      const mockPackageDirectory = '/test/empty-package';
      const mockPackageName = '@test/empty-package';

      // Set up file system with package.json but no plugins
      vol.fromJSON({
        '/test/empty-package/package.json': JSON.stringify({
          name: mockPackageName,
        }),
      });

      // Act & Assert
      await expect(
        loadPluginsInPackage(mockPackageDirectory, mockPackageName),
      ).rejects.toThrow(PluginLoaderError);
    });

    it('should handle missing package.json gracefully', async () => {
      // Arrange
      const mockPackageDirectory = '/test/no-package';
      const mockPackageName = '@test/no-package';

      const pluginMetadata: PluginMetadata = {
        name: 'no-package-plugin',
        displayName: 'No Package Plugin',
        description: 'Plugin without package.json',
        version: '1.0.0',
      };

      // Set up file system with plugin but no package.json
      vol.fromJSON({
        '/test/no-package/dist/no-package-plugin/plugin.json':
          JSON.stringify(pluginMetadata),
        '/test/no-package/dist/no-package-plugin/web.ts': 'export default {};',
        '/test/no-package/dist/no-package-plugin/common.ts':
          'export default {};',
      });

      // Act
      const result = await loadPluginsInPackage(
        mockPackageDirectory,
        mockPackageName,
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('no-package-plugin');
      // Should use default web build directory
      expect(result[0].webBuildDirectory).toBe(
        path.join(mockPackageDirectory, 'dist/web'),
      );
    });
  });

  describe('getModuleFederationTargets', () => {
    it('should generate module federation targets', async () => {
      // Arrange
      const mockPackageDirectory = '/test/federation-package';

      const pluginMetadata: PluginMetadata = {
        name: 'federation-plugin',
        displayName: 'Federation Plugin',
        description: 'A federation plugin',
        version: '1.0.0',
      };

      // Set up file system with plugin and web entrypoints
      vol.fromJSON({
        '/test/federation-package/package.json': JSON.stringify({
          name: '@test/federation-plugin',
        }),
        '/test/federation-package/dist/federation-plugin/plugin.json':
          JSON.stringify(pluginMetadata),
        '/test/federation-package/dist/federation-plugin/web.ts':
          'export default {};',
        '/test/federation-package/dist/federation-plugin/common.ts':
          'export default {};',
      });

      // Act
      const result = await getModuleFederationTargets(mockPackageDirectory);

      // Assert
      expect(result).toEqual({
        'federation-plugin/web': 'dist/federation-plugin/web.ts',
        'federation-plugin/common': 'dist/federation-plugin/common.ts',
      });
    });

    it('should throw error when no plugins found', async () => {
      // Arrange
      const mockPackageDirectory = '/test/empty-federation';

      // Set up file system with package.json but no plugins
      vol.fromJSON({
        '/test/empty-federation/package.json': JSON.stringify({
          name: '@test/empty-federation',
        }),
      });

      // Act & Assert
      await expect(
        getModuleFederationTargets(mockPackageDirectory),
      ).rejects.toThrow('No plugins found');
    });
  });

  describe('PluginLoaderError', () => {
    it('should create error with correct message and inner error', () => {
      const innerError = new Error('Inner error message');
      const error = new PluginLoaderError('Test error', innerError);

      expect(error.message).toBe(
        'Error loading plugin (Test error): Inner error message',
      );
      expect(error.innerError).toBe(innerError);
      expect(error.name).toBe('PluginLoaderError');
    });

    it('should handle non-Error inner errors', () => {
      const error = new PluginLoaderError('Test error', 'string error');

      expect(error.message).toBe(
        'Error loading plugin (Test error): string error',
      );
      expect(error.innerError).toBe('string error');
    });
  });
});
