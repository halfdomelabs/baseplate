import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FileData } from '@src/output/generator-task-output.js';

import type { TemplateFileMetadataBase } from './metadata.js';

import { TEMPLATE_METADATA_FILENAME } from '../constants.js';
import { writeTemplateMetadata } from './write-template-metadata.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

interface ExtendedTemplateMetadata extends TemplateFileMetadataBase {
  variables?: string[] | { name: string; value: string }[];
}

interface ExtendedFileData extends Omit<FileData, 'options'> {
  options?: {
    templateMetadata?: ExtendedTemplateMetadata;
  };
}

type DirectoryMetadata = Record<string, ExtendedTemplateMetadata>;

describe('writeTemplateMetadata', () => {
  const outputDirectory = '/test/output';

  beforeEach(() => {
    vol.reset();
    // Initialize the virtual file system with the output directory
    vol.fromJSON({
      [outputDirectory]: null, // Create empty directory
    });
  });

  it('should write metadata files in directories with template metadata', async () => {
    const files = new Map<string, ExtendedFileData>([
      [
        'src/controllers/user-controller.ts',
        {
          id: 'test-1',
          contents: 'test content',
          options: {
            templateMetadata: {
              type: 'typescript',
              generator: '@halfdomelabs/fastify-generators/prisma/crud-file',
              template: 'controllers/user-controller.ts',
              variables: ['TPL_METHODS', 'TPL_MODEL'],
            },
          },
        },
      ],
      [
        'src/controllers/product-controller.ts',
        {
          id: 'test-2',
          contents: 'test content',
          options: {
            templateMetadata: {
              type: 'typescript',
              generator: '@halfdomelabs/fastify-generators/prisma/crud-file',
              template: 'controllers/product-controller.ts',
              variables: ['TPL_METHODS', 'TPL_MODEL'],
            },
          },
        },
      ],
      [
        'src/models/user-model.ts',
        {
          id: 'test-3',
          contents: 'test content',
          options: {
            templateMetadata: {
              type: 'typescript',
              generator: '@halfdomelabs/fastify-generators/prisma/model',
              template: 'models/user-model.ts',
              variables: ['TPL_MODEL_NAME'],
            },
          },
        },
      ],
      [
        'README.md',
        {
          id: 'test-4',
          contents: 'test content',
          options: {
            templateMetadata: {
              type: 'text',
              generator: '@halfdomelabs/fastify-generators/core/readme',
              template: 'README.md',
              variables: [{ name: 'TPL_PROJECT_NAME', value: 'my-project' }],
            },
          },
        },
      ],
    ]);

    await writeTemplateMetadata(
      files as Map<string, FileData>,
      outputDirectory,
    );

    // Verify metadata files were created in correct locations
    const controllersMetadata = JSON.parse(
      vol.readFileSync(
        `${outputDirectory}/src/controllers/${TEMPLATE_METADATA_FILENAME}`,
        'utf8',
      ) as string,
    ) as DirectoryMetadata;
    const modelsMetadata = JSON.parse(
      vol.readFileSync(
        `${outputDirectory}/src/models/${TEMPLATE_METADATA_FILENAME}`,
        'utf8',
      ) as string,
    ) as DirectoryMetadata;
    const rootMetadata = JSON.parse(
      vol.readFileSync(
        `${outputDirectory}/${TEMPLATE_METADATA_FILENAME}`,
        'utf8',
      ) as string,
    ) as DirectoryMetadata;

    // Verify controllers metadata
    expect(controllersMetadata).toEqual({
      'user-controller.ts': {
        type: 'typescript',
        generator: '@halfdomelabs/fastify-generators/prisma/crud-file',
        template: 'controllers/user-controller.ts',
        variables: ['TPL_METHODS', 'TPL_MODEL'],
      },
      'product-controller.ts': {
        type: 'typescript',
        generator: '@halfdomelabs/fastify-generators/prisma/crud-file',
        template: 'controllers/product-controller.ts',
        variables: ['TPL_METHODS', 'TPL_MODEL'],
      },
    });

    // Verify models metadata
    expect(modelsMetadata).toEqual({
      'user-model.ts': {
        type: 'typescript',
        generator: '@halfdomelabs/fastify-generators/prisma/model',
        template: 'models/user-model.ts',
        variables: ['TPL_MODEL_NAME'],
      },
    });

    // Verify root metadata
    expect(rootMetadata).toEqual({
      'README.md': {
        type: 'text',
        generator: '@halfdomelabs/fastify-generators/core/readme',
        template: 'README.md',
        variables: [{ name: 'TPL_PROJECT_NAME', value: 'my-project' }],
      },
    });
  });

  it('should skip files without template metadata', async () => {
    const files = new Map<string, ExtendedFileData>([
      [
        'src/controllers/user-controller.ts',
        {
          id: 'test-1',
          contents: 'test content',
          options: {
            templateMetadata: {
              type: 'typescript',
              generator: '@halfdomelabs/fastify-generators/prisma/crud-file',
              template: 'controllers/user-controller.ts',
              variables: ['TPL_METHODS', 'TPL_MODEL'],
            },
          },
        },
      ],
      [
        'src/controllers/product-controller.ts',
        {
          id: 'test-2',
          contents: 'test content',
          // No template metadata
        },
      ],
    ]);

    await writeTemplateMetadata(
      files as Map<string, FileData>,
      outputDirectory,
    );

    // Verify only metadata for files with template metadata was written
    const controllersMetadata = JSON.parse(
      vol.readFileSync(
        `${outputDirectory}/src/controllers/${TEMPLATE_METADATA_FILENAME}`,
        'utf8',
      ) as string,
    ) as DirectoryMetadata;

    expect(controllersMetadata).toEqual({
      'user-controller.ts': {
        type: 'typescript',
        generator: '@halfdomelabs/fastify-generators/prisma/crud-file',
        template: 'controllers/user-controller.ts',
        variables: ['TPL_METHODS', 'TPL_MODEL'],
      },
    });
  });

  it('should handle empty file map', async () => {
    const files = new Map<string, FileData>();

    await writeTemplateMetadata(files, outputDirectory);

    // Verify no metadata files were created
    expect(() => vol.readdirSync(outputDirectory)).not.toThrow();
    expect(vol.readdirSync(outputDirectory)).toHaveLength(0);
  });

  it('should handle files with no options', async () => {
    const files = new Map<string, FileData>([
      [
        'src/controllers/user-controller.ts',
        {
          id: 'test-1',
          contents: 'test content',
          // No options at all
        },
      ],
    ]);

    await writeTemplateMetadata(files, outputDirectory);

    // Verify no metadata files were created
    expect(() => vol.readdirSync(outputDirectory)).not.toThrow();
    expect(vol.readdirSync(outputDirectory)).toHaveLength(0);
  });
});
