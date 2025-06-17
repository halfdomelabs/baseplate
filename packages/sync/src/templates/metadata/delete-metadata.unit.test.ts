import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  GENERATOR_INFO_FILENAME,
  TEMPLATE_METADATA_FILENAME,
} from '../constants.js';
import { deleteMetadataFiles } from './delete-metadata.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('deleteMetadataFiles', () => {
  const testDirectory = '/test/project';

  beforeEach(() => {
    vol.reset();
    // Initialize the virtual file system with test files
    vol.fromJSON({
      [testDirectory]: null,
      [`${testDirectory}/src/controllers/${TEMPLATE_METADATA_FILENAME}`]: '{}',
      [`${testDirectory}/src/models/${TEMPLATE_METADATA_FILENAME}`]: '{}',
      [`${testDirectory}/src/controllers/user-controller.ts`]: '// some code',
      [`${testDirectory}/src/models/user-model.ts`]: '// some code',
    });
  });

  it('should delete all metadata files', async () => {
    await deleteMetadataFiles(testDirectory);

    // Verify generator metadata file is deleted
    expect(() =>
      vol.readFileSync(`${testDirectory}/${GENERATOR_INFO_FILENAME}`),
    ).toThrow();

    // Verify template metadata files are deleted
    expect(() =>
      vol.readFileSync(
        `${testDirectory}/src/controllers/${TEMPLATE_METADATA_FILENAME}`,
      ),
    ).toThrow();
    expect(() =>
      vol.readFileSync(
        `${testDirectory}/src/models/${TEMPLATE_METADATA_FILENAME}`,
      ),
    ).toThrow();

    // Verify other files are not deleted
    expect(
      vol.readFileSync(`${testDirectory}/src/controllers/user-controller.ts`),
    ).toBeDefined();
    expect(
      vol.readFileSync(`${testDirectory}/src/models/user-model.ts`),
    ).toBeDefined();
  });

  it('should handle non-existent metadata files gracefully', async () => {
    // Delete all metadata files first
    await deleteMetadataFiles(testDirectory);

    // Try to delete again - should not throw
    await expect(deleteMetadataFiles(testDirectory)).resolves.not.toThrow();
  });
});
