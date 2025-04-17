import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import { Project } from 'ts-morph';
import { describe, expect, test } from 'vitest';

import type { TypescriptMorpher } from '@src/types.js';

import { TS_MORPH_MANIPULATION_SETTINGS } from '@src/constants/ts-morph-settings.js';

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

  let prettierConfig: prettier.Options | null;

  describe(`Test morpher ${morpher.name}`, () => {
    test.each(testCases)('case $caseName', async ({ casePath }) => {
      if (!prettierConfig) {
        prettierConfig = await prettier.resolveConfig(
          path.dirname(fileURLToPath(import.meta.url)),
        );
      }
      // Load files with arbitrary extensions
      const optionsPath = path.join(casePath, 'options.json');
      const inputFilename = getFileWithTsExtension(casePath, 'input');
      const outputText = readFileWithTsExtension(casePath, 'output');

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
        manipulationSettings: TS_MORPH_MANIPULATION_SETTINGS,
      });
      const sourceFile = project.addSourceFileAtPath(
        path.join(casePath, inputFilename),
      );
      morpher.transform(sourceFile, options, {
        packageDirectory: fullTestFolderPath,
      });

      const transformedText = sourceFile.getFullText();

      const formattedText = await prettier.format(transformedText, {
        ...prettierConfig,
        parser: 'typescript',
      });

      if (formattedText !== outputText) {
        console.info(formattedText);
      }

      expect(formattedText).toEqual(outputText);
    });
  });
}
