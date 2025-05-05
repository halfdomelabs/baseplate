import { existsSync, lstatSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import prettier from 'prettier';
import { Project } from 'ts-morph';

import type { TypescriptMorpher } from './types.js';

import { TS_MORPH_MANIPULATION_SETTINGS } from './constants/ts-morph-settings.js';
import { findNearestAncestorFile } from './utils/find-nearest-ancestor-file.js';

/**
 * The context for a morpher run.
 */
export interface MorphContext {
  /**
   * Whether to run the morpher in dry run mode.
   */
  dryRun?: boolean;
}

/**
 * Runs a morpher on a given path.
 *
 * @param targetPath - The path to run the morpher on.
 * @param morpher - The morpher to run.
 * @param options - The options to pass to the morpher.
 * @param context - The context to pass to the morpher.
 */
export async function runMorpher(
  targetPath: string,
  morpher: TypescriptMorpher,
  options: Record<string, string>,
  { dryRun }: MorphContext,
): Promise<void> {
  // load path
  const tsConfig = findNearestAncestorFile(targetPath, 'tsconfig.json');

  if (!tsConfig) {
    throw new Error(`Could not find a tsconfig.json file for ${targetPath}`);
  }

  const project = new Project({
    tsConfigFilePath: tsConfig,
    skipAddingFilesFromTsConfig: !morpher.saveUsingTsMorph,
    manipulationSettings: TS_MORPH_MANIPULATION_SETTINGS,
  });

  const prettierConfig = await prettier.resolveConfig(targetPath);

  if (!existsSync(targetPath)) {
    throw new Error(`Path ${targetPath} does not exist`);
  }

  const sourceGlobs = morpher.pathGlobs ?? ['**/*.ts', '**/*.tsx'];

  // load files from path
  if (lstatSync(targetPath).isDirectory()) {
    project.addSourceFilesAtPaths([
      ...sourceGlobs.map((glob) => `${targetPath}/${glob}`),
      '!**/node_modules/**',
      '!**/dist/**',
      '!**/templates/**',
    ]);
  } else {
    project.addSourceFileAtPath(targetPath);
  }

  const sourceFiles = project.getSourceFiles();
  const sourceFilesLength = sourceFiles.length;

  // run morpher on each file
  console.info(
    `Running morpher ${morpher.name} on ${sourceFilesLength} files...`,
  );
  const spinner = ora('Transforming files...').start();
  let processedFiles = 0;
  let changedFiles = 0;
  const erroredFiles: { filePath: string; error: unknown }[] = [];
  for (const sourceFile of sourceFiles) {
    try {
      spinner.text = `Transformed ${processedFiles}/${sourceFilesLength} files (${changedFiles} changed)`;
      let isModified = false as boolean;
      const onModified = (): void => {
        isModified = true;
      };
      sourceFile.onModified(onModified);
      morpher.transform(sourceFile, options, {
        packageDirectory: path.dirname(tsConfig),
      });
      sourceFile.onModified(onModified, false);

      processedFiles += 1;
      if (isModified) {
        changedFiles += 1;

        if (!dryRun) {
          if (morpher.saveUsingTsMorph) {
            await project.save();
          } else {
            const formatted = await prettier.format(sourceFile.getFullText(), {
              ...prettierConfig,
              parser: 'typescript',
            });
            writeFileSync(sourceFile.getFilePath(), formatted, {
              encoding: 'utf8',
            });
          }
        }
      }
    } catch (err) {
      erroredFiles.push({ filePath: sourceFile.getFilePath(), error: err });
    }
  }

  if (erroredFiles.length > 0) {
    spinner.fail(
      `Transformed ${processedFiles}/${sourceFilesLength} files (${changedFiles} changed) but with errors in ${erroredFiles.length} files`,
    );
    for (const { filePath, error } of erroredFiles) {
      console.error(`Error in file ${filePath}: ${String(error)}`);
    }
  } else {
    spinner.succeed(
      `Transformed ${processedFiles}/${sourceFilesLength} files (${changedFiles} changed)`,
    );
  }
}
