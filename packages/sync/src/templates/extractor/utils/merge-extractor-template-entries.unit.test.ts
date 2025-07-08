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

  it('should update single generator with new template entries', async () => {
    // Arrange
    const originalConfig: ExtractorConfig = {
      name: 'test-generator',
      templates: {
        'existing-template': {
          sourceFile: 'existing-template.ts',
          type: 'ts',
          description: 'Existing template',
        },
        instanceData: {},
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
        templateName: 'new-template-1',
        sourceAbsolutePath:
          '/packages/package1/generators/test/templates/new-template-1.ts',
        metadata: {
          sourceFile: 'new-template-1.ts',
          type: 'ts',
          description: 'New template 1',
        },
        instanceData: {},
      },
      {
        generator: '@test/package1#test-generator',
        templateName: 'new-template-2',
        sourceAbsolutePath:
          '/packages/package1/generators/test/templates/new-template-2.ts',
        metadata: {
          sourceFile: 'new-template-2.ts',
          type: 'ts',
          description: 'New template 2',
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
        description: 'Existing template',
      },
      'new-template-1': {
        sourceFile: 'new-template-1.ts',
        type: 'ts',
        description: 'New template 1',
      },
      'new-template-2': {
        sourceFile: 'new-template-2.ts',
        type: 'ts',
        description: 'New template 2',
      },
    });
  });

  it('should update multiple generators with their respective template entries', async () => {
    // Arrange
    const config1: ExtractorConfig = {
      name: 'generator-1',
      templates: {
        'template-1': {
          sourceFile: 'template-1.ts',
          type: 'ts',
        },
        instanceData: {},
      },
      extractors: {},
    };

    const config2: ExtractorConfig = {
      name: 'generator-2',
      templates: {
        'template-2': {
          sourceFile: 'template-2.ts',
          type: 'js',
        },
        instanceData: {},
      },
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

    expect(updatedConfig1?.config.templates).toHaveProperty('template-1');
    expect(updatedConfig1?.config.templates).toHaveProperty('new-ts-template');

    expect(updatedConfig2?.config.templates).toHaveProperty('template-2');
    expect(updatedConfig2?.config.templates).toHaveProperty('new-js-template');
  });

  it('should overwrite existing template entries with same path', async () => {
    // Arrange
    const originalConfig: ExtractorConfig = {
      name: 'test-generator',
      templates: {
        'existing-template': {
          sourceFile: 'existing-template.ts',
          type: 'ts',
          description: 'Original description',
        },
        instanceData: {},
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
        instanceData: {},
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

  it('should dedupe templates by name when same name exists with different path', async () => {
    // Arrange
    const originalConfig: ExtractorConfig = {
      name: 'test-generator',
      templates: {
        'old-path/my-template': {
          sourceFile: 'my-template.ts',
          type: 'ts',
          description: 'Original template at old path',
        },
        'other-template': {
          sourceFile: 'other-template.ts',
          type: 'js',
          description: 'Should be preserved',
        },
        instanceData: {},
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
        templateName: 'my-template',
        sourceAbsolutePath:
          '/packages/package1/generators/test/templates/new-path/my-template.ts',
        metadata: {
          sourceFile: 'my-template.ts',
          type: 'ts',
          description: 'Updated template at new path',
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

    // Should only have 2 templates: the new one and the preserved one
    expect(Object.keys(updatedConfig?.config.templates ?? {})).toEqual([
      'new-path/my-template',
      'other-template',
    ]);

    // The old template with same name should be removed
    expect(updatedConfig?.config.templates).not.toHaveProperty(
      'old-path/my-template',
    );

    // The new template should be present with updated content
    expect(updatedConfig?.config.templates['new-path/my-template']).toEqual({
      sourceFile: 'my-template.ts',
      type: 'ts',
      description: 'Updated template at new path',
    });

    // The other template should be preserved
    expect(updatedConfig?.config.templates['other-template']).toEqual({
      sourceFile: 'other-template.ts',
      type: 'js',
      description: 'Should be preserved',
    });
  });

  it('should handle multiple templates with same names being replaced', async () => {
    // Arrange
    const originalConfig: ExtractorConfig = {
      name: 'test-generator',
      templates: {
        'old-path/template-a': {
          sourceFile: 'template-a.ts',
          type: 'ts',
          description: 'Old template A',
        },
        'old-path/template-b': {
          sourceFile: 'template-b.ts',
          type: 'js',
          description: 'Old template B',
        },
        'keep-me': {
          name: 'keep-me',
          type: 'ts',
          description: 'Should be kept',
        },
        instanceData: {},
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
        templateName: 'template-a',
        sourceAbsolutePath:
          '/packages/package1/generators/test/templates/new-path/template-a.ts',
        metadata: {
          sourceFile: 'template-a.ts',
          type: 'ts',
          description: 'New template A',
        },
        instanceData: {},
      },
      {
        generator: '@test/package1#test-generator',
        templateName: 'template-b',
        sourceAbsolutePath:
          '/packages/package1/generators/test/templates/new-path/template-b.ts',
        metadata: {
          sourceFile: 'template-b.ts',
          type: 'js',
          description: 'New template B',
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

    // Should have 3 templates: 2 new ones and 1 preserved
    expect(Object.keys(updatedConfig?.config.templates ?? {})).toEqual([
      'keep-me',
      'new-path/template-a',
      'new-path/template-b',
    ]);

    // Old templates should be removed
    expect(updatedConfig?.config.templates).not.toHaveProperty(
      'old-path/template-a',
    );
    expect(updatedConfig?.config.templates).not.toHaveProperty(
      'old-path/template-b',
    );

    // New templates should be present
    expect(updatedConfig?.config.templates['new-path/template-a']).toEqual({
      sourceFile: 'template-a.ts',
      type: 'ts',
      description: 'New template A',
    });
    expect(updatedConfig?.config.templates['new-path/template-b']).toEqual({
      sourceFile: 'template-b.ts',
      type: 'js',
      description: 'New template B',
    });

    // Existing template with different name should be preserved
    expect(updatedConfig?.config.templates['keep-me']).toEqual({
      name: 'keep-me',
      type: 'ts',
      description: 'Should be kept',
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
});
