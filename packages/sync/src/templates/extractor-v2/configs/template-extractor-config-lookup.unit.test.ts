import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { ExtractorConfig } from './index.js';

import { TemplateExtractorConfigLookup } from './template-extractor-config-lookup.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('TemplateExtractorConfigLookup', () => {
  const mockPackageMap = new Map([
    ['@test/package1', '/packages/package1'],
    ['@test/package2', '/packages/package2'],
  ]);
  const mockFileIdMap = new Map([
    ['@test/package1#existing-extractor:src/file.ts', '123'],
    ['@test/package1#existing-extractor:src/file2.ts', '456'],
  ]);

  beforeEach(() => {
    vol.reset();
  });

  it('should find and cache extractor config', async () => {
    // Arrange
    const extractorConfig = {
      name: 'test-generator',
      templates: {},
      extractors: {},
    };
    vol.fromJSON({
      '/packages/package1/generators/test/extractor.json':
        JSON.stringify(extractorConfig),
    });

    const lookup = new TemplateExtractorConfigLookup(
      mockPackageMap,
      mockFileIdMap,
    );
    await lookup.initialize();

    // Act
    const result = lookup.getExtractorConfig('@test/package1#test-generator');

    // Assert
    expect(result).toBeDefined();
    expect(result?.config).toEqual(extractorConfig);
    expect(result?.packageName).toBe('@test/package1');
    expect(result?.packagePath).toBe('/packages/package1');
    expect(result?.generatorDirectory).toBe(
      '/packages/package1/generators/test',
    );
  });

  it('should find and cache provider config', async () => {
    // Arrange
    const providerConfig = {
      'test.ts': {
        'test-provider': {
          type: 'ts-imports',
          config: {},
        },
      },
    };
    vol.fromJSON({
      '/packages/package1/providers/providers.json':
        JSON.stringify(providerConfig),
    });

    const lookup = new TemplateExtractorConfigLookup(
      mockPackageMap,
      mockFileIdMap,
    );
    await lookup.initialize();

    // Act
    const result = lookup.getProviderConfigByName(
      '@test/package1:test-provider',
    );

    // Assert
    expect(result).toBeDefined();
    expect(result?.config).toEqual(providerConfig['test.ts']['test-provider']);
    expect(result?.packageName).toBe('@test/package1');
    expect(result?.packagePath).toBe('/packages/package1');
    expect(result?.packagePathSpecifier).toBe(
      '@test/package1:providers/test.ts',
    );
  });

  it('should find provider configs by type', async () => {
    // Arrange
    const providerConfig = {
      'test.ts': {
        'test-provider': {
          type: 'ts-imports',
          config: {},
        },
        'other-provider': {
          type: 'ts-imports',
          config: {},
        },
      },
    };
    vol.fromJSON({
      '/packages/package1/providers/providers.json':
        JSON.stringify(providerConfig),
    });

    const lookup = new TemplateExtractorConfigLookup(
      mockPackageMap,
      mockFileIdMap,
    );
    await lookup.initialize();

    // Act
    const results = lookup.getProviderConfigsByType(
      'ts-imports',
      z.object({
        type: z.literal('ts-imports'),
      }),
    );

    // Assert
    expect(results).toHaveLength(2);
    expect(results[0].config.type).toBe('ts-imports');
    expect(results[1].config.type).toBe('ts-imports');
  });

  it('should throw error for invalid provider name format', async () => {
    // Arrange
    const lookup = new TemplateExtractorConfigLookup(
      mockPackageMap,
      mockFileIdMap,
    );
    await lookup.initialize();

    // Act & Assert
    expect(() => lookup.getProviderConfigByName('invalid-name')).toThrow(
      'Invalid provider name: invalid-name. Should be of form "package-name:provider-name"',
    );
  });

  it('should throw error when accessing configs before initialization', () => {
    // Arrange
    const lookup = new TemplateExtractorConfigLookup(
      mockPackageMap,
      mockFileIdMap,
    );

    // Act & Assert
    expect(() => lookup.getExtractorConfig('test')).toThrow(
      'TemplateExtractorConfigLookup must be initialized before use',
    );
    expect(() => lookup.getProviderConfigByName('test:provider')).toThrow(
      'TemplateExtractorConfigLookup must be initialized before use',
    );
    expect(() =>
      lookup.getProviderConfigsByType(
        'test',
        z.object({ type: z.literal('test') }),
      ),
    ).toThrow('TemplateExtractorConfigLookup must be initialized before use');
  });

  it('should only initialize once', async () => {
    // Arrange
    const lookup = new TemplateExtractorConfigLookup(
      mockPackageMap,
      mockFileIdMap,
    );
    await lookup.initialize();

    // Act & Assert
    await expect(lookup.initialize()).resolves.not.toThrow();
  });

  describe('setExtractorConfig', () => {
    it('should update existing extractor config in the cache', async () => {
      // Arrange
      vol.fromJSON({
        '/packages/package1/generators/existing/extractor.json': JSON.stringify(
          {
            name: 'existing-extractor',
            templates: {},
            extractors: {},
          },
        ),
      });

      const lookup = new TemplateExtractorConfigLookup(
        mockPackageMap,
        mockFileIdMap,
      );
      await lookup.initialize();

      // Verify the original config exists
      const originalConfig = lookup.getExtractorConfig(
        '@test/package1#existing-extractor',
      );
      expect(originalConfig).toBeDefined();

      const updatedConfig: ExtractorConfig = {
        name: 'existing-extractor',
        templates: {
          'new-template': {
            name: 'new-template',
            type: 'ts',
            schema: {
              type: 'object',
              properties: {
                testProp: { type: 'string' },
              },
            },
          },
        },
        extractors: {},
      };

      // Act
      lookup.setExtractorConfig(
        '@test/package1#existing-extractor',
        updatedConfig,
      );

      // Assert
      const retrievedConfig = lookup.getExtractorConfig(
        '@test/package1#existing-extractor',
      );
      expect(retrievedConfig).toBeDefined();
      expect(retrievedConfig?.config).toEqual(updatedConfig);
      expect(retrievedConfig?.packageName).toBe('@test/package1');
      expect(retrievedConfig?.generatorDirectory).toBe(
        '/packages/package1/generators/existing',
      );
      expect(retrievedConfig?.packagePath).toBe('/packages/package1');
    });

    it('should overwrite existing config with same name', async () => {
      // Arrange
      const originalConfig = {
        name: 'test-extractor',
        templates: {
          'original-template': {
            name: 'original-template',
            type: 'ts',
            schema: {
              type: 'object',
              properties: {
                oldProp: { type: 'string' },
              },
            },
          },
        },
        extractors: {},
      };

      vol.fromJSON({
        '/packages/package1/generators/test/extractor.json':
          JSON.stringify(originalConfig),
      });

      const lookup = new TemplateExtractorConfigLookup(
        mockPackageMap,
        mockFileIdMap,
      );
      await lookup.initialize();

      // Verify original config exists
      const originalEntry = lookup.getExtractorConfig(
        '@test/package1#test-extractor',
      );
      expect(originalEntry?.config.templates).toHaveProperty(
        'original-template',
      );

      const updatedConfig: ExtractorConfig = {
        name: 'test-extractor',
        templates: {
          'updated-template': {
            name: 'updated-template',
            type: 'ts',
            schema: {
              type: 'object',
              properties: {
                newProp: { type: 'number' },
              },
            },
          },
        },
        extractors: {},
      };

      // Act
      lookup.setExtractorConfig('@test/package1#test-extractor', updatedConfig);

      // Assert
      const retrievedConfig = lookup.getExtractorConfig(
        '@test/package1#test-extractor',
      );
      expect(retrievedConfig?.config).toEqual(updatedConfig);
      expect(retrievedConfig?.generatorDirectory).toBe(
        '/packages/package1/generators/test',
      ); // Should keep original directory
      expect(retrievedConfig?.config.templates).toHaveProperty(
        'updated-template',
      );
      expect(retrievedConfig?.config.templates).not.toHaveProperty(
        'original-template',
      );
    });

    it('should throw error if not initialized', () => {
      // Arrange
      const lookup = new TemplateExtractorConfigLookup(
        mockPackageMap,
        mockFileIdMap,
      );

      const config: ExtractorConfig = {
        name: 'test-extractor',
        templates: {},
        extractors: {},
      };

      // Act & Assert
      expect(() => {
        lookup.setExtractorConfig('@test/package1#test-extractor', config);
      }).toThrow(
        'TemplateExtractorConfigLookup must be initialized before use',
      );
    });

    it('should allow setting configs for different packages', async () => {
      // Arrange
      vol.fromJSON({
        '/packages/package1/generators/a/extractor.json': JSON.stringify({
          name: 'extractor-a',
          templates: {},
          extractors: {},
        }),
        '/packages/package2/generators/b/extractor.json': JSON.stringify({
          name: 'extractor-b',
          templates: {},
          extractors: {},
        }),
      });

      const lookup = new TemplateExtractorConfigLookup(
        mockPackageMap,
        mockFileIdMap,
      );
      await lookup.initialize();

      const configA: ExtractorConfig = {
        name: 'extractor-a',
        templates: {
          'template-a': {
            name: 'template-a',
            type: 'ts',
            schema: { type: 'object' },
          },
        },
        extractors: {},
      };

      const configB: ExtractorConfig = {
        name: 'extractor-b',
        templates: {
          'template-b': {
            name: 'template-b',
            type: 'ts',
            schema: { type: 'array' },
          },
        },
        extractors: {},
      };

      // Act
      lookup.setExtractorConfig('@test/package1#extractor-a', configA);
      lookup.setExtractorConfig('@test/package2#extractor-b', configB);

      // Assert
      const retrievedA = lookup.getExtractorConfig(
        '@test/package1#extractor-a',
      );
      const retrievedB = lookup.getExtractorConfig(
        '@test/package2#extractor-b',
      );

      expect(retrievedA?.config).toEqual(configA);
      expect(retrievedA?.packageName).toBe('@test/package1');
      expect(retrievedB?.config).toEqual(configB);
      expect(retrievedB?.packageName).toBe('@test/package2');
    });

    it('should throw error when trying to update non-existent generator', async () => {
      // Arrange
      vol.fromJSON({
        '/packages/package1/generators/existing/extractor.json': JSON.stringify(
          {
            name: 'existing-extractor',
            templates: {},
            extractors: {},
          },
        ),
      });

      const lookup = new TemplateExtractorConfigLookup(
        mockPackageMap,
        mockFileIdMap,
      );
      await lookup.initialize();

      const config: ExtractorConfig = {
        name: 'non-existent',
        templates: {},
        extractors: {},
      };

      // Act & Assert
      expect(() => {
        lookup.setExtractorConfig('@test/package1#non-existent', config);
      }).toThrow(
        'Cannot update extractor config for @test/package1#non-existent: generator not found in cache. Please ensure the generator exists before updating.',
      );
    });
  });

  describe('updateExtractorTemplateConfig', () => {
    it('should update existing template config', async () => {
      // Arrange
      const originalConfig = {
        name: 'test-extractor',
        templates: {
          'test-template': {
            name: 'test-template',
            type: 'ts',
            schema: {
              type: 'object',
              properties: {
                oldProp: { type: 'string' },
              },
            },
          },
        },
        extractors: {},
      };

      vol.fromJSON({
        '/packages/package1/generators/test/extractor.json':
          JSON.stringify(originalConfig),
      });

      const lookup = new TemplateExtractorConfigLookup(
        mockPackageMap,
        mockFileIdMap,
      );
      await lookup.initialize();

      const updatedTemplate = {
        name: 'test-template',
        type: 'ts',
        schema: {
          type: 'object',
          properties: {
            newProp: { type: 'number' },
          },
        },
      };

      // Act
      lookup.updateExtractorTemplateConfig(
        '@test/package1#test-extractor',
        updatedTemplate,
      );

      // Assert
      const config = lookup.getExtractorConfig('@test/package1#test-extractor');
      expect(config?.config.templates['test-template']).toEqual(
        updatedTemplate,
      );
    });

    it('should throw error if template not found', async () => {
      // Arrange
      const config = {
        name: 'test-extractor',
        templates: {
          'existing-template': {
            name: 'existing-template',
            type: 'ts',
            schema: { type: 'object' },
          },
        },
        extractors: {},
      };

      vol.fromJSON({
        '/packages/package1/generators/test/extractor.json':
          JSON.stringify(config),
      });

      const lookup = new TemplateExtractorConfigLookup(
        mockPackageMap,
        mockFileIdMap,
      );
      await lookup.initialize();

      const nonExistentTemplate = {
        name: 'non-existent-template',
        type: 'ts',
        schema: { type: 'object' },
      };

      // Act & Assert
      expect(() => {
        lookup.updateExtractorTemplateConfig(
          '@test/package1#test-extractor',
          nonExistentTemplate,
        );
      }).toThrow(
        'Template non-existent-template not found in generator @test/package1#test-extractor',
      );
    });

    it('should throw error if generator not found', async () => {
      // Arrange
      const lookup = new TemplateExtractorConfigLookup(
        mockPackageMap,
        mockFileIdMap,
      );
      await lookup.initialize();

      const template = {
        name: 'test-template',
        type: 'ts',
        schema: { type: 'object' },
      };

      // Act & Assert
      expect(() => {
        lookup.updateExtractorTemplateConfig(
          '@test/package1#non-existent',
          template,
        );
      }).toThrow('Generator @test/package1#non-existent not found');
    });
  });

  describe('getOutputRelativePathForTemplate', () => {
    it('should return relative path for existing template', async () => {
      // Arrange
      const lookup = new TemplateExtractorConfigLookup(
        mockPackageMap,
        mockFileIdMap,
      );
      await lookup.initialize();

      // Act
      const path = lookup.getOutputRelativePathForTemplate(
        '@test/package1#existing-extractor',
        'src/file.ts',
      );

      // Assert
      expect(path).toBe('123');
    });

    it('should return undefined for non-existent template', async () => {
      // Arrange
      const lookup = new TemplateExtractorConfigLookup(
        mockPackageMap,
        mockFileIdMap,
      );
      await lookup.initialize();

      // Act
      const path = lookup.getOutputRelativePathForTemplate(
        '@test/package1#existing-extractor',
        'non-existent.ts',
      );

      // Assert
      expect(path).toBeUndefined();
    });
  });

  describe('getPluginConfigForGenerator', () => {
    it('should return plugin config when available', async () => {
      // Arrange
      const extractorConfig = {
        name: 'test-generator',
        templates: {},
        extractors: {},
        pluginConfig: {
          'test-plugin': {
            enabled: true,
            apiKey: 'test-key',
            settings: {
              timeout: 5000,
            },
          },
          'another-plugin': {
            mode: 'development',
          },
        },
      };
      vol.fromJSON({
        '/packages/package1/generators/test/extractor.json':
          JSON.stringify(extractorConfig),
      });

      const lookup = new TemplateExtractorConfigLookup(
        mockPackageMap,
        mockFileIdMap,
      );
      await lookup.initialize();

      const testPluginSchema = z.object({
        enabled: z.boolean(),
        apiKey: z.string(),
        settings: z.object({
          timeout: z.number(),
        }),
      });

      // Act
      const result = lookup.getPluginConfigForGenerator(
        '@test/package1#test-generator',
        'test-plugin',
        testPluginSchema,
      );

      // Assert
      expect(result).toEqual({
        enabled: true,
        apiKey: 'test-key',
        settings: {
          timeout: 5000,
        },
      });
    });

    it('should return undefined when plugin config does not exist', async () => {
      // Arrange
      const extractorConfig = {
        name: 'test-generator',
        templates: {},
        extractors: {},
        pluginConfig: {
          'other-plugin': {
            enabled: false,
          },
        },
      };
      vol.fromJSON({
        '/packages/package1/generators/test/extractor.json':
          JSON.stringify(extractorConfig),
      });

      const lookup = new TemplateExtractorConfigLookup(
        mockPackageMap,
        mockFileIdMap,
      );
      await lookup.initialize();

      const schema = z.object({
        enabled: z.boolean(),
      });

      // Act
      const result = lookup.getPluginConfigForGenerator(
        '@test/package1#test-generator',
        'non-existent-plugin',
        schema,
      );

      // Assert
      expect(result).toBeUndefined();
    });

    it('should validate and parse plugin config with schema', async () => {
      // Arrange
      const extractorConfig = {
        name: 'test-generator',
        templates: {},
        extractors: {},
        pluginConfig: {
          'auth-plugin': {
            provider: 'auth0',
            enabled: true,
            settings: {
              domain: 'example.auth0.com',
              clientId: 'test-client-id',
            },
          },
        },
      };
      vol.fromJSON({
        '/packages/package1/generators/test/extractor.json':
          JSON.stringify(extractorConfig),
      });

      const lookup = new TemplateExtractorConfigLookup(
        mockPackageMap,
        mockFileIdMap,
      );
      await lookup.initialize();

      const authPluginSchema = z.object({
        provider: z.string(),
        enabled: z.boolean(),
        settings: z.object({
          domain: z.string(),
          clientId: z.string(),
        }),
      });

      // Act
      const result = lookup.getPluginConfigForGenerator(
        '@test/package1#test-generator',
        'auth-plugin',
        authPluginSchema,
      );

      // Assert
      expect(result).toEqual({
        provider: 'auth0',
        enabled: true,
        settings: {
          domain: 'example.auth0.com',
          clientId: 'test-client-id',
        },
      });
      // Verify TypeScript typing - this should be properly typed
      expect(result?.provider).toBe('auth0');
      expect(result?.enabled).toBe(true);
      expect(result?.settings.domain).toBe('example.auth0.com');
    });

    it('should throw validation error for invalid plugin config', async () => {
      // Arrange
      const extractorConfig = {
        name: 'test-generator',
        templates: {},
        extractors: {},
        pluginConfig: {
          'auth-plugin': {
            provider: 'auth0',
            enabled: 'invalid-boolean', // This should fail validation
          },
        },
      };
      vol.fromJSON({
        '/packages/package1/generators/test/extractor.json':
          JSON.stringify(extractorConfig),
      });

      const lookup = new TemplateExtractorConfigLookup(
        mockPackageMap,
        mockFileIdMap,
      );
      await lookup.initialize();

      const authPluginSchema = z.object({
        provider: z.string(),
        enabled: z.boolean(),
      });

      // Act & Assert
      expect(() =>
        lookup.getPluginConfigForGenerator(
          '@test/package1#test-generator',
          'auth-plugin',
          authPluginSchema,
        ),
      ).toThrow();
    });
  });
});
