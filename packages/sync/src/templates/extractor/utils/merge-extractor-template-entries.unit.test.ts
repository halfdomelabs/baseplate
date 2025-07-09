import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestLogger } from '#src/tests/logger.test-utils.js';

import type { ExtractorConfig } from '../configs/index.js';
import type { TemplateFileExtractorMetadataEntry } from '../runner/template-file-extractor.js';

import { TemplateExtractorConfigLookup } from '../configs/template-extractor-config-lookup.js';
import { TemplateExtractorContext } from '../runner/template-extractor-context.js';
import { TemplateExtractorFileContainer } from '../runner/template-extractor-file-container.js';
import { mergeExtractorTemplateEntries } from './merge-extractor-template-entries.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('mergeExtractorTemplateEntries', () => {
  const mockPackageMap = new Map([
    ['@test/package1', '/packages/package1'],
    ['@test/package2', '/packages/package2'],
  ]);

  const createMockContext = async (
    configLookup: TemplateExtractorConfigLookup,
  ): Promise<TemplateExtractorContext> => {
    await configLookup.initialize();
    return new TemplateExtractorContext({
      configLookup,
      logger: createTestLogger(),
      outputDirectory: '/test',
      plugins: new Map(),
      fileContainer: new TemplateExtractorFileContainer([
        ...mockPackageMap.values(),
      ]),
    });
  };

  beforeEach(() => {
    vol.reset();
  });

  it('should merge new template entries into existing extractor config', async () => {
    // Arrange
    const originalConfig: ExtractorConfig = {
      name: 'test-generator',
      templates: {
        'existing-template': {
          sourceFile: 'existing-template.ts',
          type: 'ts',
        },
      },
      extractors: {},
    };

    vol.fromJSON({
      '/packages/package1/generators/test/extractor.json':
        JSON.stringify(originalConfig),
    });

    const configLookup = new TemplateExtractorConfigLookup(mockPackageMap);
    const context = await createMockContext(configLookup);

    const metadataEntries: TemplateFileExtractorMetadataEntry[] = [
      {
        generator: '@test/package1#test-generator',
        templateName: 'new-template',
        sourceAbsolutePath:
          '/packages/package1/generators/test/templates/new-template.ts',
        metadata: {
          sourceFile: 'new-template.ts',
          type: 'ts',
        },
        instanceData: {},
      },
    ];

    // Act
    mergeExtractorTemplateEntries(metadataEntries, context);

    // Assert
    const updatedConfig = context.configLookup.getExtractorConfig(
      '@test/package1#test-generator',
    );
    expect(updatedConfig?.config.templates).toEqual({
      'existing-template': {
        sourceFile: 'existing-template.ts',
        type: 'ts',
      },
      'new-template': {
        sourceFile: 'new-template.ts',
        type: 'ts',
      },
    });
  });

  it('should update multiple generators with their respective template entries', async () => {
    // Arrange
    const config1: ExtractorConfig = {
      name: 'generator-1',
      templates: {},
      extractors: {},
    };

    const config2: ExtractorConfig = {
      name: 'generator-2',
      templates: {},
      extractors: {},
    };

    vol.fromJSON({
      '/packages/package1/generators/gen1/extractor.json':
        JSON.stringify(config1),
      '/packages/package2/generators/gen2/extractor.json':
        JSON.stringify(config2),
    });

    const configLookup = new TemplateExtractorConfigLookup(mockPackageMap);
    const context = await createMockContext(configLookup);

    const metadataEntries: TemplateFileExtractorMetadataEntry[] = [
      {
        generator: '@test/package1#generator-1',
        templateName: 'new-ts-template',
        sourceAbsolutePath:
          '/packages/package1/generators/gen1/templates/new-ts-template.ts',
        metadata: {
          sourceFile: 'new-ts-template.ts',
          type: 'ts',
        },
        instanceData: {},
      },
      {
        generator: '@test/package2#generator-2',
        templateName: 'new-js-template',
        sourceAbsolutePath:
          '/packages/package2/generators/gen2/templates/new-js-template.ts',
        metadata: {
          sourceFile: 'new-js-template.js',
          type: 'js',
        },
        instanceData: {},
      },
    ];

    // Act
    mergeExtractorTemplateEntries(metadataEntries, context);

    // Assert
    const updatedConfig1 = context.configLookup.getExtractorConfig(
      '@test/package1#generator-1',
    );
    const updatedConfig2 = context.configLookup.getExtractorConfig(
      '@test/package2#generator-2',
    );

    expect(updatedConfig1?.config.templates).toHaveProperty('new-ts-template');
    expect(updatedConfig2?.config.templates).toHaveProperty('new-js-template');
  });

  it('should overwrite existing template entries with same name', async () => {
    // Arrange
    const originalConfig: ExtractorConfig = {
      name: 'test-generator',
      templates: {
        'existing-template': {
          sourceFile: 'existing-template.ts',
          type: 'ts',
          description: 'Original description',
        },
      },
      extractors: {},
    };

    vol.fromJSON({
      '/packages/package1/generators/test/extractor.json':
        JSON.stringify(originalConfig),
    });

    const configLookup = new TemplateExtractorConfigLookup(mockPackageMap);
    const context = await createMockContext(configLookup);

    const metadataEntries: TemplateFileExtractorMetadataEntry[] = [
      {
        generator: '@test/package1#test-generator',
        templateName: 'existing-template',
        sourceAbsolutePath:
          '/packages/package1/generators/test/templates/existing-template.ts',
        metadata: {
          sourceFile: 'existing-template.ts',
          type: 'ts',
          description: 'Updated description',
        },
        instanceData: {},
      },
    ];

    // Act
    mergeExtractorTemplateEntries(metadataEntries, context);

    // Assert
    const updatedConfig = context.configLookup.getExtractorConfig(
      '@test/package1#test-generator',
    );
    expect(updatedConfig?.config.templates['existing-template']).toEqual({
      sourceFile: 'existing-template.ts',
      type: 'ts',
      description: 'Updated description',
    });
  });

  it('should preserve extractors and other config properties', async () => {
    // Arrange
    const originalConfig: ExtractorConfig = {
      name: 'test-generator',
      templates: {},
      extractors: {
        'ts-extractor': {
          config: { option: 'value' },
        },
      },
    };

    vol.fromJSON({
      '/packages/package1/generators/test/extractor.json':
        JSON.stringify(originalConfig),
    });

    const configLookup = new TemplateExtractorConfigLookup(mockPackageMap);
    const context = await createMockContext(configLookup);

    const metadataEntries: TemplateFileExtractorMetadataEntry[] = [
      {
        generator: '@test/package1#test-generator',
        templateName: 'new-template',
        sourceAbsolutePath:
          '/packages/package1/generators/test/templates/new-template.ts',
        metadata: {
          sourceFile: 'new-template.ts',
          type: 'ts',
        },
        instanceData: {},
      },
    ];

    // Act
    mergeExtractorTemplateEntries(metadataEntries, context);

    // Assert
    const updatedConfig = context.configLookup.getExtractorConfig(
      '@test/package1#test-generator',
    );
    expect(updatedConfig?.config.extractors).toEqual({
      'ts-extractor': {
        config: { option: 'value' },
      },
    });
  });

  it('should handle empty metadata entries array', async () => {
    // Arrange
    const configLookup = new TemplateExtractorConfigLookup(mockPackageMap);
    const context = await createMockContext(configLookup);

    // Act & Assert - should not throw
    expect(() => {
      mergeExtractorTemplateEntries([], context);
    }).not.toThrow();
  });

  it('should throw error when generator config is not found', async () => {
    // Arrange
    const configLookup = new TemplateExtractorConfigLookup(mockPackageMap);
    const context = await createMockContext(configLookup);

    const metadataEntries: TemplateFileExtractorMetadataEntry[] = [
      {
        generator: '@test/nonexistent#generator',
        templateName: 'template',
        sourceAbsolutePath: '/path/to/template.ts',
        metadata: {
          sourceFile: 'template.ts',
          type: 'ts',
        },
        instanceData: {},
      },
    ];

    // Act & Assert
    expect(() => {
      mergeExtractorTemplateEntries(metadataEntries, context);
    }).toThrow(
      "No 'extractor.json' found for generator: @test/nonexistent#generator",
    );
  });
});
