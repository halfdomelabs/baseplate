import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExtractorConfig, TemplateConfig } from '../configs/index.js';
import type { TemplateFileExtractorMetadataEntry } from '../runner/template-file-extractor.js';

import { TemplateExtractorConfigLookup } from '../configs/template-extractor-config-lookup.js';
import { TemplateExtractorFileContainer } from '../runner/template-extractor-file-container.js';
import { updateExtractorTemplateEntries } from './update-extractor-template-entries.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('updateExtractorTemplateEntries', () => {
  const mockPackageMap = new Map([
    ['@test/package1', '/packages/package1'],
    ['@test/package2', '/packages/package2'],
  ]);

  beforeEach(() => {
    vol.reset();
  });

  it('should update single generator with new template entries', async () => {
    // Arrange
    const originalConfig: ExtractorConfig = {
      name: 'test-generator',
      templates: {
        'existing-template': {
          name: 'existing-template',
          type: 'ts',
          description: 'Existing template',
        },
      },
      extractors: {},
    };

    vol.fromJSON({
      '/packages/package1/generators/test/extractor.json':
        JSON.stringify(originalConfig),
    });

    const configLookup = new TemplateExtractorConfigLookup(mockPackageMap);
    await configLookup.initialize();

    const fileContainer = new TemplateExtractorFileContainer();

    const metadataEntries: TemplateFileExtractorMetadataEntry[] = [
      {
        generator: '@test/package1#test-generator',
        generatorTemplatePath: 'new-template-1',
        metadata: {
          name: 'new-template-1',
          type: 'ts',
          description: 'New template 1',
        },
      },
      {
        generator: '@test/package1#test-generator',
        generatorTemplatePath: 'new-template-2',
        metadata: {
          name: 'new-template-2',
          type: 'ts',
          description: 'New template 2',
        },
      },
    ];

    // Act
    updateExtractorTemplateEntries(
      metadataEntries,
      configLookup,
      fileContainer,
    );

    // Assert
    const updatedConfig = configLookup.getExtractorConfig(
      '@test/package1#test-generator',
    );
    expect(updatedConfig?.config.templates).toEqual({
      'existing-template': {
        name: 'existing-template',
        type: 'ts',
        description: 'Existing template',
      },
      'new-template-1': {
        name: 'new-template-1',
        type: 'ts',
        description: 'New template 1',
      },
      'new-template-2': {
        name: 'new-template-2',
        type: 'ts',
        description: 'New template 2',
      },
    });

    // Verify the file was written to the container
    const files = fileContainer.getFiles();
    const generatorJsonPath =
      '/packages/package1/generators/test/generators.json';
    expect(files.has(generatorJsonPath)).toBe(true);

    const writtenContent = files.get(generatorJsonPath);
    expect(writtenContent).toBeDefined();
    const parsedContent = JSON.parse(writtenContent as string) as {
      templates: Record<string, TemplateConfig>;
    };
    expect(parsedContent.templates).toHaveProperty('existing-template');
    expect(parsedContent.templates).toHaveProperty('new-template-1');
    expect(parsedContent.templates).toHaveProperty('new-template-2');
  });

  it('should update multiple generators with their respective template entries', async () => {
    // Arrange
    const config1: ExtractorConfig = {
      name: 'generator-1',
      templates: {
        'template-1': {
          name: 'template-1',
          type: 'ts',
        },
      },
      extractors: {},
    };

    const config2: ExtractorConfig = {
      name: 'generator-2',
      templates: {
        'template-2': {
          name: 'template-2',
          type: 'js',
        },
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
    await configLookup.initialize();

    const fileContainer = new TemplateExtractorFileContainer();

    const metadataEntries: TemplateFileExtractorMetadataEntry[] = [
      {
        generator: '@test/package1#generator-1',
        generatorTemplatePath: 'new-ts-template',
        metadata: {
          name: 'new-ts-template',
          type: 'ts',
        },
      },
      {
        generator: '@test/package2#generator-2',
        generatorTemplatePath: 'new-js-template',
        metadata: {
          name: 'new-js-template',
          type: 'js',
        },
      },
    ];

    // Act
    updateExtractorTemplateEntries(
      metadataEntries,
      configLookup,
      fileContainer,
    );

    // Assert
    const updatedConfig1 = configLookup.getExtractorConfig(
      '@test/package1#generator-1',
    );
    const updatedConfig2 = configLookup.getExtractorConfig(
      '@test/package2#generator-2',
    );

    expect(updatedConfig1?.config.templates).toHaveProperty('template-1');
    expect(updatedConfig1?.config.templates).toHaveProperty('new-ts-template');

    expect(updatedConfig2?.config.templates).toHaveProperty('template-2');
    expect(updatedConfig2?.config.templates).toHaveProperty('new-js-template');

    // Verify files were written
    const files = fileContainer.getFiles();
    expect(
      files.has('/packages/package1/generators/gen1/generators.json'),
    ).toBe(true);
    expect(
      files.has('/packages/package2/generators/gen2/generators.json'),
    ).toBe(true);
  });

  it('should overwrite existing template entries with same path', async () => {
    // Arrange
    const originalConfig: ExtractorConfig = {
      name: 'test-generator',
      templates: {
        'existing-template': {
          name: 'existing-template',
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
    await configLookup.initialize();

    const fileContainer = new TemplateExtractorFileContainer();

    const metadataEntries: TemplateFileExtractorMetadataEntry[] = [
      {
        generator: '@test/package1#test-generator',
        generatorTemplatePath: 'existing-template',
        metadata: {
          name: 'existing-template',
          type: 'ts',
          description: 'Updated description',
        },
      },
    ];

    // Act
    updateExtractorTemplateEntries(
      metadataEntries,
      configLookup,
      fileContainer,
    );

    // Assert
    const updatedConfig = configLookup.getExtractorConfig(
      '@test/package1#test-generator',
    );
    expect(updatedConfig?.config.templates['existing-template']).toEqual({
      name: 'existing-template',
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
    await configLookup.initialize();

    const fileContainer = new TemplateExtractorFileContainer();

    const metadataEntries: TemplateFileExtractorMetadataEntry[] = [
      {
        generator: '@test/package1#test-generator',
        generatorTemplatePath: 'new-template',
        metadata: {
          name: 'new-template',
          type: 'ts',
        },
      },
    ];

    // Act
    updateExtractorTemplateEntries(
      metadataEntries,
      configLookup,
      fileContainer,
    );

    // Assert
    const updatedConfig = configLookup.getExtractorConfig(
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
    await configLookup.initialize();

    const fileContainer = new TemplateExtractorFileContainer();

    // Act & Assert - should not throw
    expect(() => {
      updateExtractorTemplateEntries([], configLookup, fileContainer);
    }).not.toThrow();

    // No files should be written
    const files = fileContainer.getFiles();
    expect(files.size).toBe(0);
  });
});
