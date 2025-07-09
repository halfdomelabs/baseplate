import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FileData } from '#src/output/generator-task-output.js';

import type { TemplateInfo } from './metadata.js';

import { TEMPLATES_INFO_FILENAME } from '../constants.js';
import { writeTemplateInfoFiles } from './write-template-info-files.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

interface ExtendedFileData extends Omit<FileData, 'options'> {
  options?: {
    templateInfo?: TemplateInfo;
  };
}

type DirectoryMetadata = Record<string, TemplateInfo>;

describe('writeTemplateInfoFiles', () => {
  const outputDirectory = '/test/output';

  beforeEach(() => {
    vol.reset();
    // Initialize the virtual file system with the output directory
    vol.fromJSON({
      [outputDirectory]: null, // Create empty directory
    });
  });

  it('should write info files in directories with template info', async () => {
    const files = new Map<string, ExtendedFileData>([
      [
        'src/controllers/user-controller.ts',
        {
          id: 'test-1',
          contents: 'test content',
          options: {
            templateInfo: {
              template: 'user-controller',
              generator: '@baseplate-dev/fastify-generators/prisma/crud-file',
              instanceData: {
                methods: ['TPL_METHODS'],
                model: 'TPL_MODEL',
              },
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
            templateInfo: {
              template: 'product-controller',
              generator: '@baseplate-dev/fastify-generators/prisma/crud-file',
              instanceData: {
                methods: ['TPL_METHODS'],
                model: 'TPL_MODEL',
              },
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
            templateInfo: {
              template: 'user-model',
              generator: '@baseplate-dev/fastify-generators/prisma/model',
              instanceData: {
                modelName: 'TPL_MODEL_NAME',
              },
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
            templateInfo: {
              template: 'readme',
              generator: '@baseplate-dev/fastify-generators/core/readme',
              instanceData: {
                projectName: 'my-project',
              },
            },
          },
        },
      ],
    ]);

    await writeTemplateInfoFiles(
      files as Map<string, FileData>,
      outputDirectory,
    );

    // Verify info files were created in correct locations
    const controllersMetadata = JSON.parse(
      vol.readFileSync(
        `${outputDirectory}/src/controllers/${TEMPLATES_INFO_FILENAME}`,
        'utf8',
      ) as string,
    ) as DirectoryMetadata;
    const modelsMetadata = JSON.parse(
      vol.readFileSync(
        `${outputDirectory}/src/models/${TEMPLATES_INFO_FILENAME}`,
        'utf8',
      ) as string,
    ) as DirectoryMetadata;
    const rootMetadata = JSON.parse(
      vol.readFileSync(
        `${outputDirectory}/${TEMPLATES_INFO_FILENAME}`,
        'utf8',
      ) as string,
    ) as DirectoryMetadata;

    // Verify controllers metadata
    expect(controllersMetadata).toEqual({
      'user-controller.ts': {
        template: 'user-controller',
        generator: '@baseplate-dev/fastify-generators/prisma/crud-file',
        instanceData: {
          methods: ['TPL_METHODS'],
          model: 'TPL_MODEL',
        },
      },
      'product-controller.ts': {
        template: 'product-controller',
        generator: '@baseplate-dev/fastify-generators/prisma/crud-file',
        instanceData: {
          methods: ['TPL_METHODS'],
          model: 'TPL_MODEL',
        },
      },
    });

    // Verify models metadata
    expect(modelsMetadata).toEqual({
      'user-model.ts': {
        template: 'user-model',
        generator: '@baseplate-dev/fastify-generators/prisma/model',
        instanceData: {
          modelName: 'TPL_MODEL_NAME',
        },
      },
    });

    // Verify root metadata
    expect(rootMetadata).toEqual({
      'README.md': {
        template: 'readme',
        generator: '@baseplate-dev/fastify-generators/core/readme',
        instanceData: {
          projectName: 'my-project',
        },
      },
    });
  });

  it('should skip files without template info', async () => {
    const files = new Map<string, ExtendedFileData>([
      [
        'src/controllers/user-controller.ts',
        {
          id: 'test-1',
          contents: 'test content',
          options: {
            templateInfo: {
              template: 'user-controller',
              generator: '@baseplate-dev/fastify-generators/prisma/crud-file',
              instanceData: {
                methods: ['TPL_METHODS'],
                model: 'TPL_MODEL',
              },
            },
          },
        },
      ],
      [
        'src/controllers/product-controller.ts',
        {
          id: 'test-2',
          contents: 'test content',
          // No template info
        },
      ],
    ]);

    await writeTemplateInfoFiles(
      files as Map<string, FileData>,
      outputDirectory,
    );

    // Verify only metadata for files with template info was written
    const controllersMetadata = JSON.parse(
      vol.readFileSync(
        `${outputDirectory}/src/controllers/${TEMPLATES_INFO_FILENAME}`,
        'utf8',
      ) as string,
    ) as DirectoryMetadata;

    expect(controllersMetadata).toEqual({
      'user-controller.ts': {
        template: 'user-controller',
        generator: '@baseplate-dev/fastify-generators/prisma/crud-file',
        instanceData: {
          methods: ['TPL_METHODS'],
          model: 'TPL_MODEL',
        },
      },
    });
  });

  it('should handle empty file map', async () => {
    const files = new Map<string, FileData>();

    await writeTemplateInfoFiles(files, outputDirectory);

    // Verify no info files were created
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

    await writeTemplateInfoFiles(files, outputDirectory);

    // Verify no info files were created
    expect(() => vol.readdirSync(outputDirectory)).not.toThrow();
    expect(vol.readdirSync(outputDirectory)).toHaveLength(0);
  });
});
