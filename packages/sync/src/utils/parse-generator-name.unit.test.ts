import { describe, expect, it } from 'vitest';

import { parseGeneratorName } from './parse-generator-name.js';

describe('parseGeneratorName', () => {
  it('parses generator with subdirectory', () => {
    // Arrange
    const input =
      '@halfdomelabs/baseplate-plugin-storage#fastify/prisma-file-transformer';

    // Act
    const result = parseGeneratorName(input);

    // Assert
    expect(result).toEqual({
      packageName: '@halfdomelabs/baseplate-plugin-storage',
      generatorPath: 'fastify/prisma-file-transformer',
      generatorBasename: 'prisma-file-transformer',
    });
  });

  it('parses generator without subdirectory', () => {
    // Arrange
    const input = '@halfdomelabs/core-generators#node';

    // Act
    const result = parseGeneratorName(input);

    // Assert
    expect(result).toEqual({
      packageName: '@halfdomelabs/core-generators',
      generatorPath: 'node',
      generatorBasename: 'node',
    });
  });

  it('throws on invalid input', () => {
    // Arrange
    const input = '@halfdomelabs/core-generators';

    // Act / Assert
    expect(() => parseGeneratorName(input)).toThrowError(
      'Invalid generator name: @halfdomelabs/core-generators. Should be of form "package#group/name"',
    );
  });
});
