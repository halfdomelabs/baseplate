import { vol } from 'memfs';
import { assert, beforeEach, describe, expect, it, vi } from 'vitest';

import { createGenerator } from './create-generator.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

describe('createGenerator', () => {
  beforeEach(() => {
    vol.reset();
  });

  it('should create a generator with all files when includeTemplates is true', () => {
    // Arrange
    vol.fromJSON({
      '/generators/.gitkeep': '',
    });

    // Act
    const result = createGenerator({
      name: 'email/sendgrid',
      directory: '/generators',
      includeTemplates: true,
    });

    // Assert
    expect(result.generatorName).toBe('email/sendgrid');
    expect(result.generatorPath).toBe('/generators/email/sendgrid');
    expect(result.message).toContain('Successfully created generator');

    const files = vol.toJSON();

    // Check main generator file exists and has correct content
    const generatorFile =
      files['/generators/email/sendgrid/sendgrid.generator.ts'];
    expect(generatorFile).toBeDefined();
    expect(generatorFile).toContain("name: 'email/sendgrid'");
    expect(generatorFile).toContain('export const sendgridGenerator');
    expect(generatorFile).toContain('SENDGRID_GENERATED');

    // Check index.ts barrel export
    const indexFile = files['/generators/email/sendgrid/index.ts'];
    expect(indexFile).toBe("export * from './sendgrid.generator.js';\n");

    // Check generated/index.ts placeholder
    const generatedIndexFile =
      files['/generators/email/sendgrid/generated/index.ts'];
    expect(generatedIndexFile).toContain('SENDGRID_GENERATED');
    expect(generatedIndexFile).toContain('undefined as never');

    // Check extractor.json
    const extractorFile = files['/generators/email/sendgrid/extractor.json'];
    assert.isNotNull(extractorFile);
    const extractorJson = JSON.parse(extractorFile) as {
      name: string;
      templates: Record<string, string>;
    };
    expect(extractorJson.name).toBe('email/sendgrid');
    expect(extractorJson.templates).toEqual({});

    // Check category index.ts was created
    const categoryIndexFile = files['/generators/email/index.ts'];
    expect(categoryIndexFile).toBe("export * from './sendgrid/index.js';\n");
  });

  it('should create a generator without template files when includeTemplates is false', () => {
    // Arrange
    vol.fromJSON({
      '/generators/.gitkeep': '',
    });

    // Act
    const result = createGenerator({
      name: 'auth/oauth',
      directory: '/generators',
      includeTemplates: false,
    });

    // Assert
    expect(result.generatorName).toBe('auth/oauth');

    const files = vol.toJSON();

    // Should have generator file and index
    expect(files['/generators/auth/oauth/oauth.generator.ts']).toBeDefined();
    expect(files['/generators/auth/oauth/index.ts']).toBeDefined();

    // Should NOT have generated dir or extractor.json
    expect(files['/generators/auth/oauth/generated/index.ts']).toBeUndefined();
    expect(files['/generators/auth/oauth/extractor.json']).toBeUndefined();
  });

  it('should update existing category index.ts when adding to existing category', () => {
    // Arrange
    vol.fromJSON({
      '/generators/email/index.ts': "export * from './postmark/index.js';\n",
      '/generators/email/postmark/postmark.generator.ts': '// existing',
    });

    // Act
    const result = createGenerator({
      name: 'email/sendgrid',
      directory: '/generators',
      includeTemplates: true,
    });

    // Assert
    const files = vol.toJSON();
    const categoryIndex = files['/generators/email/index.ts'];
    expect(categoryIndex).toContain("export * from './postmark/index.js';");
    expect(categoryIndex).toContain("export * from './sendgrid/index.js';");

    // Category index should NOT be in filesCreated since it was updated, not created
    expect(result.filesCreated).not.toContain('/generators/email/index.ts');
  });

  it('should throw error if directory does not exist', () => {
    // Arrange
    vol.fromJSON({});

    // Act & Assert
    expect(() =>
      createGenerator({
        name: 'email/sendgrid',
        directory: '/nonexistent',
        includeTemplates: true,
      }),
    ).toThrow('Directory does not exist: /nonexistent');
  });

  it('should throw error if generator already exists', () => {
    // Arrange
    vol.fromJSON({
      '/generators/email/sendgrid/.gitkeep': '',
    });

    // Act & Assert
    expect(() =>
      createGenerator({
        name: 'email/sendgrid',
        directory: '/generators',
        includeTemplates: true,
      }),
    ).toThrow('Generator directory already exists');
  });

  it('should handle kebab-case names with multiple dashes', () => {
    // Arrange
    vol.fromJSON({
      '/generators/.gitkeep': '',
    });

    // Act
    createGenerator({
      name: 'data-processing/csv-file-parser',
      directory: '/generators',
      includeTemplates: true,
    });

    // Assert
    const files = vol.toJSON();
    const generatorFile =
      files[
        '/generators/data-processing/csv-file-parser/csv-file-parser.generator.ts'
      ];
    expect(generatorFile).toContain('export const csvFileParserGenerator');
    expect(generatorFile).toContain('CSV_FILE_PARSER_GENERATED');
  });

  it('should not duplicate export if category index already has the export', () => {
    // Arrange
    vol.fromJSON({
      '/generators/email/index.ts': "export * from './sendgrid/index.js';\n",
    });

    // Act
    createGenerator({
      name: 'email/sendgrid',
      directory: '/generators',
      includeTemplates: true,
    });

    // Assert
    const files = vol.toJSON();
    const categoryIndex = files['/generators/email/index.ts'];
    // Should only appear once
    const matches = categoryIndex?.match(/sendgrid/g);
    expect(matches?.length).toBe(1);
  });
});
