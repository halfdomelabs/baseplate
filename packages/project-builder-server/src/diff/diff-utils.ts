import type { GeneratorOutput } from '@baseplate-dev/sync';
import type ignore from 'ignore';

import { shouldIncludeFile as shouldIncludeFileIgnore } from '@baseplate-dev/sync';
import * as diff from 'diff';
import { globby } from 'globby';
import { isBinaryFile } from 'isbinaryfile';
import micromatch from 'micromatch';
import fsAdapter from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { DiffSummary, FileDiff } from './types.js';

/**
 * Checks if a file path should be included based on ignore and glob patterns
 */
export function shouldIncludeFile(
  filePath: string,
  globPatterns?: string[],
  ignoreInstance?: ignore.Ignore,
): boolean {
  // Check ignore patterns first using shared function
  if (!shouldIncludeFileIgnore(filePath, ignoreInstance)) {
    return false;
  }

  // Then check glob patterns
  if (!globPatterns || globPatterns.length === 0) {
    return true;
  }
  return micromatch.isMatch(filePath, globPatterns);
}

/**
 * Reads a file from the working directory if it exists
 */
export async function readWorkingFile(
  directory: string,
  filePath: string,
): Promise<string | Buffer | null> {
  try {
    const fullPath = path.join(directory, filePath);
    const isBinary = await isBinaryFile(fullPath);

    return await (isBinary ? readFile(fullPath) : readFile(fullPath, 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Determines if content is binary (for generated content)
 */
export function isContentBinary(content: string | Buffer): content is Buffer {
  return Buffer.isBuffer(content);
}

/**
 * Creates a unified diff for text files (generated → working)
 */
export function createUnifiedDiff(
  filePath: string,
  generatedContent: string,
  workingContent: string,
): string {
  const patch = diff.createPatch(
    filePath,
    generatedContent,
    workingContent,
    'generated',
    'working',
  );
  return patch;
}

/**
 * Scans the working directory for all files, respecting ignore and glob patterns
 */
export async function scanWorkingDirectory(
  directory: string,
  globPatterns?: string[],
  ignoreInstance?: ignore.Ignore,
): Promise<string[]> {
  // Create glob pattern to match all files
  const patterns =
    globPatterns && globPatterns.length > 0 ? globPatterns : ['**/*'];

  const files = await globby(patterns, {
    cwd: directory,
    onlyFiles: true,
    fs: fsAdapter,
    gitignore: true,
    absolute: false, // Return relative paths
  });

  // Filter files using ignore patterns and glob patterns
  return files.filter((filePath) =>
    shouldIncludeFile(filePath, globPatterns, ignoreInstance),
  );
}

function normalizeAsBuffer(content: string | Buffer): Buffer {
  if (Buffer.isBuffer(content)) {
    return content;
  }
  return Buffer.from(content);
}

/**
 * Compares generated output with working directory files
 */
export async function compareFiles(
  directory: string,
  generatorOutput: GeneratorOutput,
  globPatterns?: string[],
  ignoreInstance?: ignore.Ignore,
): Promise<DiffSummary> {
  const diffs: FileDiff[] = [];
  const processedFiles = new Set<string>();

  // Process generated files
  for (const [filePath, fileData] of generatorOutput.files) {
    if (!shouldIncludeFile(filePath, globPatterns, ignoreInstance)) {
      continue;
    }

    processedFiles.add(filePath);
    const workingContent = await readWorkingFile(directory, filePath);
    const generatedContent = fileData.contents;

    const generatedIsBinary = isContentBinary(generatedContent);
    const workingIsBinary = workingContent
      ? Buffer.isBuffer(workingContent)
      : false;

    if (fileData.options?.skipWriting) {
      continue;
    }

    if (workingContent === null) {
      // File only exists in generated output - generator should not create this file
      if (generatedIsBinary) {
        diffs.push({
          path: filePath,
          type: 'deleted',
          isBinary: true,
          generatedContent,
        });
      } else {
        diffs.push({
          path: filePath,
          type: 'deleted',
          generatedContent,
          isBinary: false,
          unifiedDiff: createUnifiedDiff(filePath, generatedContent, ''),
        });
      }
    } else if (generatedIsBinary || workingIsBinary) {
      // Binary file comparison
      const areEqual =
        Buffer.isBuffer(generatedContent) && Buffer.isBuffer(workingContent)
          ? generatedContent.equals(workingContent)
          : generatedContent.toString() === workingContent.toString();

      if (!areEqual) {
        diffs.push({
          path: filePath,
          type: 'modified',
          isBinary: true,
          generatedContent: normalizeAsBuffer(generatedContent),
          workingContent: normalizeAsBuffer(workingContent),
        });
      }
    } else {
      // Text file comparison
      const generatedText = generatedContent.toString();
      const workingText = workingContent.toString();

      if (generatedText !== workingText) {
        diffs.push({
          path: filePath,
          isBinary: false,
          type: 'modified',
          generatedContent: generatedText,
          workingContent: workingText,
          unifiedDiff: createUnifiedDiff(filePath, generatedText, workingText),
        });
      }
    }
  }

  // Check for files that exist in working directory but not in generated output
  const workingDirectoryFiles = await scanWorkingDirectory(
    directory,
    globPatterns,
    ignoreInstance,
  );

  // Find files that exist in working directory but not in generated output
  for (const workingFilePath of workingDirectoryFiles) {
    if (!processedFiles.has(workingFilePath)) {
      // This file exists in working directory but not in generated output - generator should create this file
      const workingContent = await readWorkingFile(directory, workingFilePath);

      if (workingContent !== null) {
        const workingIsBinary = isContentBinary(workingContent);

        if (workingIsBinary) {
          diffs.push({
            path: workingFilePath,
            type: 'added',
            workingContent,
            isBinary: true,
          });
        } else {
          diffs.push({
            path: workingFilePath,
            type: 'added',
            workingContent,
            isBinary: workingIsBinary,
            unifiedDiff: createUnifiedDiff(workingFilePath, '', workingContent),
          });
        }
      }
    }
  }

  const summary: DiffSummary = {
    totalFiles: diffs.length,
    addedFiles: diffs.filter((d) => d.type === 'added').length,
    modifiedFiles: diffs.filter((d) => d.type === 'modified').length,
    deletedFiles: diffs.filter((d) => d.type === 'deleted').length,
    diffs,
  };

  return summary;
}
