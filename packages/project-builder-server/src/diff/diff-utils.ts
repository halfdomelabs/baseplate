import type { GeneratorOutput } from '@baseplate-dev/sync';

import * as diff from 'diff';
import { isBinaryFile } from 'isbinaryfile';
import micromatch from 'micromatch';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { DiffSummary, FileDiff } from './types.js';

/**
 * Checks if a file path should be included based on glob patterns
 */
export function shouldIncludeFile(
  filePath: string,
  globPatterns?: string[],
): boolean {
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
export function isContentBinary(content: string | Buffer): boolean {
  return Buffer.isBuffer(content);
}

/**
 * Creates a unified diff for text files
 */
export function createUnifiedDiff(
  filePath: string,
  oldContent: string,
  newContent: string,
): string {
  const patch = diff.createPatch(
    filePath,
    oldContent,
    newContent,
    'working',
    'generated',
  );
  return patch;
}

/**
 * Compares generated output with working directory files
 */
export async function compareFiles(
  directory: string,
  generatorOutput: GeneratorOutput,
  globPatterns?: string[],
): Promise<DiffSummary> {
  const diffs: FileDiff[] = [];
  const processedFiles = new Set<string>();

  // Process generated files
  for (const [filePath, fileData] of generatorOutput.files) {
    if (!shouldIncludeFile(filePath, globPatterns)) {
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
      // File only exists in generated output
      diffs.push({
        path: filePath,
        type: 'added',
        generatedContent,
        isBinary: generatedIsBinary,
        unifiedDiff: generatedIsBinary
          ? undefined
          : createUnifiedDiff(filePath, '', generatedContent.toString()),
      });
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
          generatedContent,
          workingContent,
          isBinary: true,
        });
      }
    } else {
      // Text file comparison
      const generatedText = generatedContent.toString();
      const workingText = workingContent.toString();

      if (generatedText !== workingText) {
        diffs.push({
          path: filePath,
          type: 'modified',
          generatedContent,
          workingContent,
          isBinary: false,
          unifiedDiff: createUnifiedDiff(filePath, workingText, generatedText),
        });
      }
    }
  }

  // TODO: Check for files that exist in working directory but not in generated output
  // This would require scanning the working directory, which might be expensive
  // For now, we'll focus on differences in generated files

  const summary: DiffSummary = {
    totalFiles: diffs.length,
    addedFiles: diffs.filter((d) => d.type === 'added').length,
    modifiedFiles: diffs.filter((d) => d.type === 'modified').length,
    deletedFiles: diffs.filter((d) => d.type === 'deleted').length,
    diffs,
  };

  return summary;
}
