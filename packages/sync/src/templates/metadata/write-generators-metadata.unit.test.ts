import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FileData } from '@src/output/generator-task-output.js';

import type { TemplateFileMetadataBase } from './metadata.js';

import { buildTestGeneratorEntry } from '../../runner/tests/factories.test-helper.js';
import { GENERATOR_INFO_FILENAME } from '../constants.js';
import { writeGeneratorsMetadata } from './write-generators-metadata.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');
vi.mock('@halfdomelabs/utils/node', () => ({
  findNearestPackageJson: vi.fn(),
}));

describe('writeGeneratorsMetadata', () => {
  const outputDirectory = '/test/output';

  beforeEach(() => {
    vol.reset();
    // Initialize the virtual file system with the output directory
    vol.fromJSON({
      [outputDirectory]: null, // Create empty directory
    });
  });

  it('should write generator metadata for files with template metadata', async () => {
    const generatorEntry = buildTestGeneratorEntry({
      generatorInfo: {
        name: 'test-generator',
        baseDirectory: '/test/generator/core/test',
      },
    });

    const files = new Map<string, FileData>([
      [
        'src/controllers/user-controller.ts',
        {
          id: 'test-1',
          contents: 'test content',
          options: {
            templateMetadata: {
              type: 'typescript',
              generator: 'test-generator',
              template: 'controllers/user-controller.ts',
            } as TemplateFileMetadataBase,
          },
        },
      ],
    ]);

    // Mock findNearestPackageJson to return a package.json path
    const { findNearestPackageJson } = await import('@halfdomelabs/utils/node');
    (findNearestPackageJson as ReturnType<typeof vi.fn>).mockResolvedValue(
      '/test/generator/package.json',
    );

    await writeGeneratorsMetadata(generatorEntry, files, outputDirectory);

    // Verify metadata file was created
    expect(
      JSON.parse(
        vol.readFileSync(
          `${outputDirectory}/${GENERATOR_INFO_FILENAME}`,
          'utf8',
        ) as string,
      ),
    ).toEqual({
      'test-generator': 'core/test',
    });
  });

  it('should skip generators without template metadata', async () => {
    const generatorEntry = buildTestGeneratorEntry({
      generatorInfo: {
        name: 'test-generator',
        baseDirectory: '/test/generator',
      },
    });

    const files = new Map<string, FileData>([
      [
        'src/controllers/user-controller.ts',
        {
          id: 'test-1',
          contents: 'test content',
          // No template metadata
        },
      ],
    ]);

    // Mock findNearestPackageJson to return a package.json path
    const { findNearestPackageJson } = await import('@halfdomelabs/utils/node');
    (findNearestPackageJson as ReturnType<typeof vi.fn>).mockResolvedValue(
      '/test/generator/package.json',
    );

    await writeGeneratorsMetadata(generatorEntry, files, outputDirectory);

    // Verify the metadata file is equal to empty object
    expect(
      JSON.parse(
        vol.readFileSync(
          `${outputDirectory}/${GENERATOR_INFO_FILENAME}`,
          'utf8',
        ) as string,
      ),
    ).toEqual({});
  });

  it('should handle nested generators', async () => {
    const childGenerator = buildTestGeneratorEntry({
      generatorInfo: {
        name: 'child-generator',
        baseDirectory: '/test/generator/dist/child',
      },
    });

    const generatorEntry = buildTestGeneratorEntry({
      generatorInfo: {
        name: 'test-generator',
        baseDirectory: '/test/generator',
      },
      children: [childGenerator],
    });

    const files = new Map<string, FileData>([
      [
        'src/controllers/user-controller.ts',
        {
          id: 'test-1',
          contents: 'test content',
          options: {
            templateMetadata: {
              type: 'typescript',
              generator: 'child-generator',
              template: 'controllers/user-controller.ts',
            } as TemplateFileMetadataBase,
          },
        },
      ],
    ]);

    // Mock findNearestPackageJson to return package.json paths
    const { findNearestPackageJson } = await import('@halfdomelabs/utils/node');
    (findNearestPackageJson as ReturnType<typeof vi.fn>).mockImplementation(
      ({ cwd }: { cwd: string }) => {
        if (cwd === '/test/generator') {
          return '/test/generator/package.json';
        }
        if (cwd === '/test/generator/dist/child') {
          return '/test/generator/package.json';
        }
        return;
      },
    );

    await writeGeneratorsMetadata(generatorEntry, files, outputDirectory);

    // Verify metadata file was created with both generators
    const metadata = JSON.parse(
      vol.readFileSync(
        `${outputDirectory}/${GENERATOR_INFO_FILENAME}`,
        'utf8',
      ) as string,
    ) as Record<string, { name: string; packageRelativePath: string }>;

    expect(metadata).toEqual({
      'child-generator': 'src/child',
    });
  });
});
