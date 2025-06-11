import { vol } from 'memfs';
import { expect } from 'vitest';

/**
 * Asserts that a file exists with expected content
 */
export function expectFileToExist(
  filePath: string,
  expectedContent?: string,
): void {
  const files = vol.toJSON();
  expect(files).toHaveProperty(filePath);

  if (expectedContent !== undefined) {
    expect(files[filePath]).toBe(expectedContent);
  }
}

/**
 * Asserts that a file contains specific content (partial match)
 */
export function expectFileToContain(
  filePath: string,
  expectedContent: string,
): void {
  const files = vol.toJSON();
  expect(files).toHaveProperty(filePath);
  expect(files[filePath]).toContain(expectedContent);
}
