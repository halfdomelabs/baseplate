import type { TypescriptMorpher } from '@src/types.js';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IndentationText, Project, QuoteKind } from 'ts-morph';
import { describe, expect, test } from 'vitest';

const getFileWithTsExtension = (
  directory: string,
  baseFileName: string,
): string | undefined => {
  const files = fs.readdirSync(directory);
  return files.find(
    (file) =>
      file.startsWith(`${baseFileName}.`) &&
      (file.endsWith('.ts') || file.endsWith('.tsx')),
  );
};

const readFileWithTsExtension = (
  directory: string,
  baseFileName: string,
): string | undefined => {
  const fileName = getFileWithTsExtension(directory, baseFileName);
  if (!fileName) return undefined;
  const filePath = path.join(directory, fileName);
  return fs.readFileSync(filePath, 'utf8');
};

const collectTestCases = (
  testFolder: string,
): { caseName: string; casePath: string }[] => {
  const testCasesDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    testFolder,
  );

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- type doesn't really matter here
export function runMorpherTests(morpher: TypescriptMorpher<any>): void {
  const fullTestFolderPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    morpher.name,
  );
  const testCases = collectTestCases(fullTestFolderPath);

  describe(`Test morpher ${morpher.name}`, () => {
    test.each(testCases)('case $caseName', async ({ casePath }) => {
      // Load files with arbitrary extensions
      const optionsPath = path.join(casePath, 'options.json');
      const inputFilename = getFileWithTsExtension(casePath, 'input');
      const outputText = await readFileWithTsExtension(casePath, 'output');

      if (!inputFilename || !outputText) {
        throw new Error(
          `Missing required input or output files in ${casePath}`,
        );
      }

      const options = fs.existsSync(optionsPath)
        ? (JSON.parse(fs.readFileSync(optionsPath, 'utf8')) as Record<
            string,
            string
          >)
        : {};

      // Run the merge algorithm
      const project = new Project({
        manipulationSettings: {
          indentationText: IndentationText.TwoSpaces,
          quoteKind: QuoteKind.Single,
          usePrefixAndSuffixTextForRename: true,
          useTrailingCommas: true,
        },
      });
      const sourceFile = project.addSourceFileAtPath(
        path.join(casePath, inputFilename),
      );
      morpher.transform(sourceFile, options);

      const transformedText = sourceFile.getFullText();

      expect(transformedText).toEqual(outputText);
    });
  });
}
