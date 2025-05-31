import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTestGeneratorEntry } from '../../runner/tests/factories.test-helper.js';
import { GENERATOR_INFO_FILENAME } from '../constants.js';
import { writeGeneratorsMetadata } from './write-generators-metadata.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');
vi.mock('@baseplate-dev/utils/node', () => ({
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

    // Mock findNearestPackageJson to return a package.json path
    const { findNearestPackageJson } = await import('@baseplate-dev/utils/node');
    (findNearestPackageJson as ReturnType<typeof vi.fn>).mockResolvedValue(
      '/test/generator/package.json',
    );

    await writeGeneratorsMetadata(generatorEntry, outputDirectory);

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
        baseDirectory: '/test/generator/dist/test',
      },
      children: [childGenerator],
    });

    // Mock findNearestPackageJson to return package.json paths
    const { findNearestPackageJson } = await import('@baseplate-dev/utils/node');
    (findNearestPackageJson as ReturnType<typeof vi.fn>).mockImplementation(
      ({ cwd }: { cwd: string }) => {
        if (cwd === '/test/generator/dist/test') {
          return '/test/generator/package.json';
        }
        if (cwd === '/test/generator/dist/child') {
          return '/test/generator/package.json';
        }
        return;
      },
    );

    await writeGeneratorsMetadata(generatorEntry, outputDirectory);

    // Verify metadata file was created with both generators
    const metadata = JSON.parse(
      vol.readFileSync(
        `${outputDirectory}/${GENERATOR_INFO_FILENAME}`,
        'utf8',
      ) as string,
    ) as Record<string, { name: string; packageRelativePath: string }>;

    expect(metadata).toEqual({
      'child-generator': 'src/child',
      'test-generator': 'src/test',
    });
  });
});
