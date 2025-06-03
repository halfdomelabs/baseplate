import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GENERATOR_INFO_FILENAME } from '../constants.js';
import { createGeneratorInfoMap } from './create-generator-info-map.js';

vi.mock('node:fs/promises');

describe('createGeneratorPathMap', () => {
  const outputDirectory = '/test/output';
  const generatorPackageMap = new Map([
    ['@baseplate-dev/fastify-generators', '/test/packages/fastify-generators'],
  ]);

  beforeEach(() => {
    vol.reset();
    // Initialize the virtual file system with the output directory
    vol.fromJSON({
      [outputDirectory]: null, // Create empty directory
    });
  });

  it('should create a map of generator names to paths', async () => {
    // Setup generator info file
    const generatorInfo = {
      '@baseplate-dev/fastify-generators#core/readme':
        'src/generators/core/readme',
    };
    vol.fromJSON({
      [`${outputDirectory}/${GENERATOR_INFO_FILENAME}`]:
        JSON.stringify(generatorInfo),
    });

    const result = await createGeneratorInfoMap(
      outputDirectory,
      generatorPackageMap,
    );

    expect(result).toEqual(
      new Map([
        [
          '@baseplate-dev/fastify-generators#core/readme',
          {
            name: '@baseplate-dev/fastify-generators#core/readme',
            baseDirectory:
              '/test/packages/fastify-generators/src/generators/core/readme',
            packagePath: '/test/packages/fastify-generators',
          },
        ],
      ]),
    );
  });

  it('should throw an error if generator info file does not exist', async () => {
    await expect(
      createGeneratorInfoMap(outputDirectory, generatorPackageMap),
    ).rejects.toThrow(
      `Could not find ${GENERATOR_INFO_FILENAME} file in ${outputDirectory}`,
    );
  });

  it('should throw an error if package is not found in generator package map', async () => {
    const generatorInfo = {
      'unknown-package#core/readme': 'dist/generators/core/readme',
    };
    vol.fromJSON({
      [`${outputDirectory}/${GENERATOR_INFO_FILENAME}`]:
        JSON.stringify(generatorInfo),
    });

    await expect(
      createGeneratorInfoMap(outputDirectory, generatorPackageMap),
    ).rejects.toThrow(
      'Could not find location of the generator package for unknown-package#core/readme',
    );
  });
});
