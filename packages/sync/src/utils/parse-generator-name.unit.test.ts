import { describe, expect, it } from 'vitest';

import { parseGeneratorName } from './parse-generator-name.js';

describe('parseGeneratorName', () => {
  it('parses generator with subdirectory', () => {
    // Arrange
    const input =
      '@baseplate-dev/plugin-storage#fastify/prisma-file-transformer';

    // Act
    const result = parseGeneratorName(input);

    // Assert
    expect(result).toEqual({
      packageName: '@baseplate-dev/plugin-storage',
      generatorPath: 'fastify/prisma-file-transformer',
      generatorBasename: 'prisma-file-transformer',
    });
  });

  it('parses generator without subdirectory', () => {
    // Arrange
    const input = '@baseplate-dev/core-generators#node';

    // Act
    const result = parseGeneratorName(input);

    // Assert
    expect(result).toEqual({
      packageName: '@baseplate-dev/core-generators',
      generatorPath: 'node',
      generatorBasename: 'node',
    });
  });

  it('parses generator with nested subdirectory', () => {
    // Arrange
    const input =
      '@baseplate-dev/plugin-storage#fastify/core/prisma-file-transformer';

    // Act
    const result = parseGeneratorName(input);

    // Assert
    expect(result).toEqual({
      packageName: '@baseplate-dev/plugin-storage',
      generatorPath: 'fastify/core/prisma-file-transformer',
      generatorBasename: 'prisma-file-transformer',
    });
  });

  it('throws on invalid input', () => {
    // Arrange
    const input = '@baseplate-dev/core-generators';

    // Act / Assert
    expect(() => parseGeneratorName(input)).toThrowError(
      'Invalid generator name: @baseplate-dev/core-generators. Should be of form "package#group/name"',
    );
  });
});
