import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { writeJson } from './write-json.js';

vi.mock('node:fs/promises');

beforeEach(() => {
  vol.reset();
});

describe('writeJson', () => {
  it('should write a valid JSON file', async () => {
    // Arrange
    const filePath = '/valid.json';
    const data = { name: 'John Doe', age: 30 };

    // Act
    await writeJson(filePath, data);

    // Assert
    expect(vol.readFileSync(filePath, 'utf8')).toEqual(
      `${JSON.stringify(data, null, 2)}\n`,
    );
  });
});
