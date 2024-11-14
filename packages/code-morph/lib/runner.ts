/* eslint-disable no-console */
import { existsSync, lstatSync } from 'node:fs';
import ora from 'ora';
import { IndentationText, Project, QuoteKind } from 'ts-morph';

import type { TypescriptMorpher } from './types.js';

import { findNearestTsconfig } from './utils/find-nearest-tsconfig.js';

interface MorphContext {
  dryRun: boolean;
}

export async function runMorpher(
  path: string,
  morpher: TypescriptMorpher,
  options: unknown,
  { dryRun }: MorphContext,
): Promise<void> {
  // load path
  const tsConfig = findNearestTsconfig(path);

  if (!tsConfig) {
    throw new Error(`Could not find a tsconfig.json file for ${path}`);
  }

  const project = new Project({
    tsConfigFilePath: tsConfig,
    skipAddingFilesFromTsConfig: true,
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
      quoteKind: QuoteKind.Single,
      usePrefixAndSuffixTextForRename: true,
      useTrailingCommas: true,
    },
  });

  if (!existsSync(path)) {
    throw new Error(`Path ${path} does not exist`);
  }

  // load files from path
  if (lstatSync(path).isDirectory()) {
    project.addSourceFilesAtPaths(`${path}/**/*.ts`);
    project.addSourceFilesAtPaths(`${path}/**/*.tsx`);
  } else {
    project.addSourceFileAtPath(path);
  }

  const sourceFiles = project.getSourceFiles();
  const sourceFilesLength = sourceFiles.length;

  // validate options
  const parsedOptions = morpher.optionSchema.parse(options);

  // run morpher on each file
  console.log(
    `Running morpher ${morpher.name} on ${sourceFilesLength} files...`,
  );
  const spinner = ora('Transforming files...').start();
  let processedFiles = 0;
  let changedFiles = 0;
  for (const sourceFile of sourceFiles) {
    try {
      spinner.text = `Transformed ${processedFiles}/${sourceFilesLength} files (${changedFiles} changed)`;
      let isModified = false as boolean;
      const onModified = (): void => {
        isModified = true;
      };
      sourceFile.onModified(onModified);
      morpher.transform(sourceFile, parsedOptions);
      sourceFile.onModified(onModified, false);

      processedFiles += 1;
      if (isModified) {
        changedFiles += 1;

        if (!dryRun) {
          await sourceFile.save();
        }
      }
    } catch (err) {
      console.error(`Error transforming file ${sourceFile.getFilePath()}`);
      throw err;
    }
  }

  spinner.succeed(
    `Transformed ${processedFiles}/${sourceFilesLength} files (${changedFiles} changed)`,
  );
}
