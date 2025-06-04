import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TemplateExtractorConfigLookup } from './template-extractor-config-lookup.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('TemplateExtractorConfigLookup', () => {
  const mockPackageMap = new Map([
    ['@test/package1', '/packages/package1'],
    ['@test/package2', '/packages/package2'],
  ]);

  beforeEach(() => {
    vol.reset();
  });

  it('should find and cache extractor config', async () => {
    // Arrange
    const extractorConfig = {
      name: 'test-generator',
      root: '{package-root}',
      templates: {},
      extractors: {},
    };
    vol.fromJSON({
      '/packages/package1/generators/test/extractor.json':
        JSON.stringify(extractorConfig),
    });

    const lookup = new TemplateExtractorConfigLookup(mockPackageMap);

    // Act
    const result = await lookup.getExtractorConfig(
      '@test/package1#test-generator',
    );

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

    const lookup = new TemplateExtractorConfigLookup(mockPackageMap);

    // Act
    const result = await lookup.getProviderConfigByName(
      '@test/package1:test-provider',
    );

    // Assert
    expect(result).toBeDefined();
    expect(result?.config).toEqual(providerConfig['test.ts']['test-provider']);
    expect(result?.packageName).toBe('@test/package1');
    expect(result?.packagePath).toBe('/packages/package1');
    expect(result?.providerFilePath).toBe(
      '/packages/package1/providers/test.ts',
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

    const lookup = new TemplateExtractorConfigLookup(mockPackageMap);
    await lookup.getProviderConfigByName('@test/package1:test-provider');

    // Act
    const results = lookup.getProviderConfigsByType('ts-imports');

    // Assert
    expect(results).toHaveLength(2);
    expect(results[0].config.type).toBe('ts-imports');
    expect(results[1].config.type).toBe('ts-imports');
  });

  it('should throw error for invalid provider name format', async () => {
    // Arrange
    const lookup = new TemplateExtractorConfigLookup(mockPackageMap);

    // Act & Assert
    await expect(
      lookup.getProviderConfigByName('invalid-name'),
    ).rejects.toThrow(
      'Invalid provider name: invalid-name. Should be of form "package-name:provider-name"',
    );
  });

  it('should throw error for non-existent package', async () => {
    // Arrange
    const lookup = new TemplateExtractorConfigLookup(mockPackageMap);

    // Act & Assert
    await expect(
      lookup.getExtractorConfig('@test/nonexistent#test'),
    ).rejects.toThrow('Package @test/nonexistent not found in package map');
  });
});
