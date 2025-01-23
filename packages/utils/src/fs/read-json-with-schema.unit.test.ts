import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { readJsonWithSchema } from './read-json-with-schema.js';

vi.mock('node:fs/promises');

beforeEach(() => {
  vol.reset();
});

describe('readJsonWithSchema', () => {
  const schema = z.object({
    name: z.string(),
    age: z.number().int().positive(),
  });

  it('should validate a valid JSON file', async () => {
    // Arrange
    const filePath = '/valid.json';
    vol.fromJSON({
      [filePath]: JSON.stringify({ name: 'John Doe', age: 30 }),
    });

    // Act
    const result = await readJsonWithSchema(filePath, schema);

    // Assert
    expect(result).toEqual({ name: 'John Doe', age: 30 });
  });

  it('should throw an error if the file is not found', async () => {
    // Arrange
    const filePath = '/non-existent.json';

    // Act & Assert
    await expect(readJsonWithSchema(filePath, schema)).rejects.toThrow(
      /ENOENT: no such file or directory/,
    );
  });

  it('should throw an error if the file contains invalid JSON', async () => {
    // Arrange
    const filePath = '/invalid.json';
    vol.fromJSON({
      [filePath]: 'invalid-json',
    });

    // Act & Assert
    await expect(readJsonWithSchema(filePath, schema)).rejects.toThrow(
      'Invalid JSON in file: /invalid.json',
    );
  });

  it('should throw an error if the JSON fails schema validation', async () => {
    // Arrange
    const filePath = '/invalid-schema.json';
    vol.fromJSON({
      [filePath]: JSON.stringify({ name: 'John Doe', age: 'not-a-number' }),
    });

    // Act & Assert
    await expect(readJsonWithSchema(filePath, schema)).rejects.toThrow(
      /Validation failed for \/invalid-schema.json:/,
    );
  });
});
