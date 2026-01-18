import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TestLogger } from '#src/tests/logger.test-utils.js';

import { createTestLogger } from '#src/tests/logger.test-utils.js';

import type { OrphanedTemplateEntry } from '../../metadata/read-template-info-files.js';

import { TemplateExtractorConfigLookup } from '../configs/template-extractor-config-lookup.js';
import { cleanupOrphanedTemplates } from './cleanup-orphaned-templates.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('cleanupOrphanedTemplates', () => {
  let mockLogger: TestLogger;

  beforeEach(() => {
    vol.reset();
    vi.clearAllMocks();
    mockLogger = createTestLogger();
  });

  it('should clean up orphaned templates and return modified generators', async () => {
    // Arrange
    const extractorConfig = {
      name: 'test-generator',
      templates: {
        'orphaned-template': {
          type: 'ts',
          sourceFile: 'orphaned-template.ts',
        },
        'existing-template': {
          type: 'ts',
          sourceFile: 'existing-template.ts',
        },
      },
    };

    const metadata = {
      'orphaned.ts': {
        generator: 'test-package#test-generator',
        template: 'orphaned-template',
      },
      'existing.ts': {
        generator: 'test-package#test-generator',
        template: 'existing-template',
      },
    };

    vol.fromJSON({
      '/packages/test-package/src/generators/test-generator/extractor.json':
        JSON.stringify(extractorConfig),
      '/packages/test-package/src/generators/test-generator/templates/orphaned-template.ts':
        'export const orphaned = true;',
      '/packages/test-package/src/generators/test-generator/templates/existing-template.ts':
        'export const existing = true;',
      '/project/.templates-info.json': JSON.stringify(metadata),
      '/project/existing.ts': 'export const existing = true;',
      // Note: orphaned.ts is NOT created - it's orphaned
    });

    const packageMap = new Map([['test-package', '/packages/test-package']]);
    const configLookup = new TemplateExtractorConfigLookup(packageMap);
    await configLookup.initialize();

    const orphanedEntries: OrphanedTemplateEntry[] = [
      {
        absolutePath: '/project/orphaned.ts',
        templateInfo: {
          generator: 'test-package#test-generator',
          template: 'orphaned-template',
        },
        metadataFilePath: '/project/.templates-info.json',
        fileName: 'orphaned.ts',
      },
    ];

    // Act
    const result = await cleanupOrphanedTemplates(
      orphanedEntries,
      configLookup,
      mockLogger,
    );

    // Assert
    expect(result).toEqual(['test-package#test-generator']);

    // Template should be removed from config lookup
    expect(
      configLookup.getTemplateConfig(
        'test-package#test-generator',
        'orphaned-template',
      ),
    ).toBeUndefined();

    // Existing template should still be there
    expect(
      configLookup.getTemplateConfig(
        'test-package#test-generator',
        'existing-template',
      ),
    ).toBeDefined();

    // Template source file should be deleted
    expect(
      vol.existsSync(
        '/packages/test-package/src/generators/test-generator/templates/orphaned-template.ts',
      ),
    ).toBe(false);

    // Existing template source file should still exist
    expect(
      vol.existsSync(
        '/packages/test-package/src/generators/test-generator/templates/existing-template.ts',
      ),
    ).toBe(true);

    // Metadata entry should be removed
    const updatedMetadata = JSON.parse(
      vol.readFileSync('/project/.templates-info.json', 'utf8') as string,
    ) as Record<string, unknown>;
    expect(updatedMetadata['orphaned.ts']).toBeUndefined();
    expect(updatedMetadata['existing.ts']).toBeDefined();

    // Logger should have been called
    expect(mockLogger.getInfoOutput()).toContain(
      "Cleaned up orphaned template 'orphaned-template' for generator 'test-package#test-generator'",
    );
  });

  it('should warn and continue when generator is not found', async () => {
    // Arrange
    const metadata = {
      'orphaned.ts': {
        generator: 'unknown-package#unknown-generator',
        template: 'orphaned-template',
      },
    };

    vol.fromJSON({
      '/project/.templates-info.json': JSON.stringify(metadata),
    });

    const packageMap = new Map<string, string>();
    const configLookup = new TemplateExtractorConfigLookup(packageMap);
    await configLookup.initialize();

    const orphanedEntries: OrphanedTemplateEntry[] = [
      {
        absolutePath: '/project/orphaned.ts',
        templateInfo: {
          generator: 'unknown-package#unknown-generator',
          template: 'orphaned-template',
        },
        metadataFilePath: '/project/.templates-info.json',
        fileName: 'orphaned.ts',
      },
    ];

    // Act
    const result = await cleanupOrphanedTemplates(
      orphanedEntries,
      configLookup,
      mockLogger,
    );

    // Assert
    expect(result).toEqual([]);
    expect(mockLogger.getWarnOutput()).toContain(
      "Generator 'unknown-package#unknown-generator' not found in config lookup, skipping extractor.json cleanup for template 'orphaned-template'",
    );

    // Metadata should still be cleaned up even if generator not found
    expect(vol.existsSync('/project/.templates-info.json')).toBe(false);
  });

  it('should handle empty orphaned entries array', async () => {
    // Arrange
    const packageMap = new Map<string, string>();
    const configLookup = new TemplateExtractorConfigLookup(packageMap);
    await configLookup.initialize();

    // Act
    const result = await cleanupOrphanedTemplates([], configLookup, mockLogger);

    // Assert
    expect(result).toEqual([]);
    expect(mockLogger.getInfoOutput()).not.toContain(
      "Cleaned up orphaned template 'orphaned-template' for generator 'test-package#test-generator'",
    );
    expect(mockLogger.getWarnOutput()).not.toContain(
      "Generator 'unknown-package#unknown-generator' not found in config lookup, skipping extractor.json cleanup for template 'orphaned-template'",
    );
  });

  it('should delete metadata file when last entry is removed', async () => {
    // Arrange
    const extractorConfig = {
      name: 'test-generator',
      templates: {
        'only-template': {
          type: 'ts',
          sourceFile: 'only-template.ts',
        },
      },
    };

    const metadata = {
      'only.ts': {
        generator: 'test-package#test-generator',
        template: 'only-template',
      },
    };

    vol.fromJSON({
      '/packages/test-package/src/generators/test-generator/extractor.json':
        JSON.stringify(extractorConfig),
      '/packages/test-package/src/generators/test-generator/templates/only-template.ts':
        'export const only = true;',
      '/project/.templates-info.json': JSON.stringify(metadata),
    });

    const packageMap = new Map([['test-package', '/packages/test-package']]);
    const configLookup = new TemplateExtractorConfigLookup(packageMap);
    await configLookup.initialize();

    const orphanedEntries: OrphanedTemplateEntry[] = [
      {
        absolutePath: '/project/only.ts',
        templateInfo: {
          generator: 'test-package#test-generator',
          template: 'only-template',
        },
        metadataFilePath: '/project/.templates-info.json',
        fileName: 'only.ts',
      },
    ];

    // Act
    await cleanupOrphanedTemplates(orphanedEntries, configLookup, mockLogger);

    // Assert - metadata file should be deleted entirely
    expect(vol.existsSync('/project/.templates-info.json')).toBe(false);
  });
});
