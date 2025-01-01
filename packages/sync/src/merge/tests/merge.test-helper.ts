import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { MergeAlgorithm, MergeOptions } from '../types.js';

const getFileWithAnyExtension = (
  directory: string,
  baseFileName: string,
): string | undefined => {
  const files = fs.readdirSync(directory);
  return files.find((file) => file.startsWith(`${baseFileName}.`));
};

const readFileWithAnyExtension = (
  directory: string,
  baseFileName: string,
): string | undefined => {
  const fileName = getFileWithAnyExtension(directory, baseFileName);
  if (!fileName) return undefined;
  const filePath = path.join(directory, fileName);
  return fs.readFileSync(filePath, 'utf8');
};

const collectTestCases = (
  testFolder: string,
): { caseName: string; casePath: string }[] => {
  const testCasesDir = path.resolve(__dirname, testFolder);

  // Find all directories in the given test folder
  const testCases = fs
    .readdirSync(testCasesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((dir) => ({
      caseName: dir.name,
      casePath: path.join(testCasesDir, dir.name),
    }));

  return testCases;
};

const runMergeTests = (
  mergeAlgorithm: MergeAlgorithm,
  testFolder: string,
  mergeOptions: MergeOptions = {
    formatContents: (contents) => contents,
  },
): void => {
  const fullTestFolderPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    testFolder,
  );
  const testCases = collectTestCases(fullTestFolderPath);

  describe(`Test merge algorithm ${testFolder}`, () => {
    test.each(testCases)('case $caseName', async ({ casePath }) => {
      // Load files with arbitrary extensions
      const userText = readFileWithAnyExtension(casePath, 'user');
      const newText = readFileWithAnyExtension(casePath, 'new');
      const baseText = readFileWithAnyExtension(casePath, 'base');
      const expectedMergedText = readFileWithAnyExtension(casePath, 'merged');

      if (!userText || !newText) {
        throw new Error(`Missing required user or new files in ${casePath}`);
      }

      // Run the merge algorithm
      const result = await mergeAlgorithm(
        userText,
        newText,
        baseText,
        mergeOptions,
      );

      // Compare results
      if (expectedMergedText === undefined) {
        // If no merged file, the result should be null
        expect(result).toBeNull();
      } else {
        // If merged file exists, ensure the mergedText matches
        expect(result).not.toBeNull();
        if (result) {
          expect(result.mergedText).toBe(expectedMergedText);
        }
      }

      // Check hasConflict property
      if (result) {
        const containsConflictMarker = result.mergedText.includes('<<<<<<<');
        expect(result.hasConflict).toBe(containsConflictMarker);
      }
    });
  });
};

export default runMergeTests;
