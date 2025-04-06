import { existsSync, lstatSync, writeFileSync } from 'node:fs';
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
 * @param path - The path to run the morpher on.
 * @param morpher - The morpher to run.
 * @param options - The options to pass to the morpher.
 * @param context - The context to pass to the morpher.
 */
export async function runMorpher(
  path: string,
  morpher: TypescriptMorpher,
  options: Record<string, string>,
  { dryRun }: MorphContext,
): Promise<void> {
  // load path
  const tsConfig = findNearestAncestorFile(path, 'tsconfig.json');

  if (!tsConfig) {
    throw new Error(`Could not find a tsconfig.json file for ${path}`);
  }

  const project = new Project({
    tsConfigFilePath: tsConfig,
    skipAddingFilesFromTsConfig: true,
    manipulationSettings: TS_MORPH_MANIPULATION_SETTINGS,
  });

  const prettierConfig = await prettier.resolveConfig(path);

  if (!existsSync(path)) {
    throw new Error(`Path ${path} does not exist`);
  }

  const sourceGlobs = morpher.pathGlobs ?? ['**/*.ts', '**/*.tsx'];

  // load files from path
  if (lstatSync(path).isDirectory()) {
    project.addSourceFilesAtPaths(sourceGlobs.map((glob) => `${path}/${glob}`));
  } else {
    project.addSourceFileAtPath(path);
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
      morpher.transform(sourceFile, options);
      sourceFile.onModified(onModified, false);

      processedFiles += 1;
      if (isModified) {
        changedFiles += 1;

        if (!dryRun) {
          const formatted = await prettier.format(sourceFile.getFullText(), {
            ...prettierConfig,
            parser: 'typescript',
          });
          writeFileSync(sourceFile.getFilePath(), formatted, {
            encoding: 'utf8',
          });
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
