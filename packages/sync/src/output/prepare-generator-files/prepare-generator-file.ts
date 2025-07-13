import path from 'node:path';

import type { Logger } from '#src/utils/index.js';

import type { GeneratorOutputFormatter } from '../formatter.js';
import type { FileData } from '../generator-task-output.js';
import type {
  GeneratorFileOperationResult,
  GeneratorOutputFileWriterContext,
} from './types.js';

import { ConflictDetectedError, FormatterError } from '../errors.js';
import {
  buildCompositeMergeAlgorithm,
  diff3MergeAlgorithm,
  gitMergeDriverAlgorithmGenerator,
  jsonMergeAlgorithm,
  simpleDiffAlgorithm,
} from '../string-merge-algorithms/index.js';

/**
 * Normalize a buffer or string to a buffer
 *
 * @param val - Buffer or string
 * @returns Buffer
 */
function normalizeBufferString(val: Buffer | string): Buffer {
  if (typeof val === 'string') {
    return Buffer.from(val, 'utf8');
  }
  return val;
}

/**
 * Check if two buffers or strings are equal
 *
 * @param a - Buffer or string
 * @param b - Buffer or string
 * @returns Whether the two buffers or strings are equal
 */
function areBufferStringsEqual(
  a: Buffer | string,
  b: Buffer | string,
): boolean {
  if (typeof a === 'string' && typeof b === 'string') return a === b;
  const bufferA = normalizeBufferString(a);
  const bufferB = normalizeBufferString(b);
  return bufferA.equals(bufferB);
}

/**
 * Format the contents of a file
 *
 * @param relativePath - Relative path of the file
 * @param data - File data
 * @param context - Context
 * @param context.outputDirectory - Output directory
 * @param context.formatters - Formatters to use
 * @param context.logger - Logger to use
 * @returns Formatted contents of the file
 */
export async function formatOutputFileContents(
  relativePath: string,
  data: FileData,
  {
    outputDirectory,
    formatters,
    logger,
  }: {
    outputDirectory: string;
    formatters: GeneratorOutputFormatter[];
    logger: Logger;
  },
): Promise<Buffer | string> {
  const { options, contents } = data;

  if (options?.skipFormatting) return contents;

  if (Buffer.isBuffer(contents)) {
    throw new TypeError(
      `Contents of file for ${relativePath} cannot be formatted since it is a Buffer`,
    );
  }

  const formattersForFile = formatters.filter(
    (f) =>
      !!f.fileExtensions?.some((ext) => path.extname(relativePath) === ext) ||
      !!f.fileNames?.some((name) => path.basename(relativePath) === name),
  );

  if (formattersForFile.length > 1) {
    throw new Error(
      `Multiple formatters found for file ${relativePath}: ${formattersForFile.map((f) => f.name).join(', ')}`,
    );
  }

  const formatter = formattersForFile.at(0);

  if (!formatter) return contents;

  try {
    const filePath = path.join(outputDirectory, relativePath);
    return await formatter.format(contents, filePath, logger);
  } catch (error) {
    throw new FormatterError(error, contents, relativePath);
  }
}

interface MergeContentsInput {
  relativePath: string;
  data: FileData;
  previousRelativePath: string;
  previousGeneratedBuffer?: Buffer;
  previousWorkingBuffer: Buffer;
  context: GeneratorOutputFileWriterContext;
}

/**
 * Merge buffer contents. It always creates a conflict since we don't have
 * a good way to merge buffer contents.
 *
 * @param input - Merge contents input
 * @returns Merge contents result
 */
async function mergeBufferContents({
  data,
  relativePath,
  previousRelativePath,
  previousWorkingBuffer,
  context,
}: MergeContentsInput): Promise<GeneratorFileOperationResult> {
  // Check for a conflict version of the working file
  const conflictVersion = await context.previousWorkingCodebase?.fileExists(
    `${relativePath}.conflict`,
  );
  if (conflictVersion) {
    throw new ConflictDetectedError(relativePath);
  }

  return {
    relativePath,
    previousRelativePath,
    mergedContents: previousWorkingBuffer,
    generatedContents: normalizeBufferString(data.contents),
    generatedConflictRelativePath: `${relativePath}.conflict`,
    hasConflict: true,
  };
}

/**
 * Merge string contents
 *
 * @param input - Merge contents input
 * @returns Merge contents result
 */
async function mergeStringContents({
  relativePath,
  data,
  previousRelativePath,
  previousGeneratedBuffer,
  previousWorkingBuffer,
  context,
}: MergeContentsInput): Promise<GeneratorFileOperationResult> {
  const { options = {}, contents } = data;

  if (Buffer.isBuffer(contents)) {
    throw new TypeError(
      `Contents of file for ${relativePath} must be provided as a string to be merged`,
    );
  }

  const previousWorkingText = previousWorkingBuffer.toString('utf8');
  const currentGeneratedText = contents;
  const previousGeneratedText = previousGeneratedBuffer?.toString('utf8');

  // Detect conflicts in the working file
  if (
    /^<<<<<<</m.test(previousWorkingText) &&
    /^>>>>>>>/m.test(previousWorkingText)
  ) {
    throw new ConflictDetectedError(relativePath);
  }

  const mergeAlgorithm = buildCompositeMergeAlgorithm([
    ...(options.mergeAlgorithms ?? []),
    ...(relativePath.endsWith('.json') ? [jsonMergeAlgorithm] : []),
    ...(context.mergeDriver
      ? [gitMergeDriverAlgorithmGenerator(context.mergeDriver)]
      : []),
    diff3MergeAlgorithm,
  ]);

  // if there's a previous generated file, we do a 3-way merge otherwise we do a simple diff
  const mergeResult = previousGeneratedText
    ? await mergeAlgorithm({
        previousWorkingText,
        currentGeneratedText,
        previousGeneratedText,
        filePath: relativePath,
      })
    : simpleDiffAlgorithm({
        previousWorkingText,
        currentGeneratedText,
      });

  if (mergeResult) {
    // do not format if there is a conflict
    const formattedMergeResult = mergeResult.hasConflict
      ? mergeResult.mergedText
      : await formatOutputFileContents(
          relativePath,
          { ...data, contents: mergeResult.mergedText },
          context,
        );
    return {
      relativePath,
      previousRelativePath,
      mergedContents: normalizeBufferString(formattedMergeResult),
      generatedContents: normalizeBufferString(contents),
      hasConflict: mergeResult.hasConflict,
    };
  }

  throw new Error(
    `Unable to merge ${relativePath} with ${path.join(
      context.outputDirectory,
      previousRelativePath,
    )}`,
  );
}

/**
 * Find the relative path of the file in the previous generated codebase
 *
 * @param data - File data
 * @param relativePath - Relative path of the file
 * @param context - Generator output file writer context
 * @returns The relative path of the file in the previous generated codebase or undefined if it does not exist
 */
async function findPreviousRelativePath(
  data: FileData,
  relativePath: string,
  context: GeneratorOutputFileWriterContext,
): Promise<string | undefined> {
  const { previousGeneratedPayload, previousWorkingCodebase } = context;

  // If the file exists in the previous working codebase, we use it as our
  // previous relative path. If the file was renamed to an existing file, the
  // engine will attempt to merge the existing file with the new generated code
  // and the previous generated file will be deleted with the standard logic.
  const previousWorkingFileExists =
    await previousWorkingCodebase?.fileExists(relativePath);
  if (previousWorkingFileExists) return relativePath;

  // If there's no previous generated payload, there is no previous relative path
  if (!previousGeneratedPayload) return undefined;

  // Find the previous generated file ID that matches the current file ID
  const previousGeneratedFileIds = [
    data.id,
    ...(data.options?.alternateFullIds ?? []),
  ].filter((id) => previousGeneratedPayload.fileIdToRelativePathMap.has(id));

  if (previousGeneratedFileIds.length > 1) {
    throw new Error(
      `File ${relativePath} has multiple matching previous generated file IDs: ${previousGeneratedFileIds.join(', ')}. ` +
        `Please remove the unused matching previous generated file IDs from the codebase map.`,
    );
  }

  const previousRelativePath =
    previousGeneratedFileIds[0] &&
    previousGeneratedPayload.fileIdToRelativePathMap.get(
      previousGeneratedFileIds[0],
    );

  if (!previousRelativePath) return undefined;

  // only return the previous relative path if it exists in the previous working codebase
  const previousRelativePathExists =
    await previousWorkingCodebase?.fileExists(previousRelativePath);
  return previousRelativePathExists ? previousRelativePath : undefined;
}

/**
 * Input for the prepareGeneratorFile function
 */
interface PrepareGeneratorFileInput {
  /**
   * Relative path of the file
   */
  relativePath: string;
  /**
   * File data
   */
  data: FileData;
  /**
   * Generator output file writer context
   */
  context: GeneratorOutputFileWriterContext;
}

/**
 * Prepare a file for writing
 *
 * @param input - Prepare generator file input
 * @returns Prepare generator file result
 */
export async function prepareGeneratorFile({
  relativePath,
  data,
  context,
}: PrepareGeneratorFileInput): Promise<GeneratorFileOperationResult> {
  const { options } = data;
  const { previousWorkingCodebase, previousGeneratedPayload } = context;

  if (options?.skipWriting) {
    return {
      relativePath,
      mergedContents: undefined,
      generatedContents: normalizeBufferString(data.contents),
      previousRelativePath: undefined,
    };
  }

  // Find previous relative path
  const previousRelativePath = await findPreviousRelativePath(
    data,
    relativePath,
    context,
  );

  const formattedContents = await formatOutputFileContents(
    relativePath,
    data,
    context,
  );

  // if the file should never overwrite and there is a previous relative path,
  // we use the working file version
  if (options?.shouldNeverOverwrite && previousRelativePath) {
    return {
      relativePath,
      mergedContents: undefined,
      generatedContents: normalizeBufferString(formattedContents),
      previousRelativePath,
    };
  }

  // If force overwrite is enabled, bypass all merge logic and use generated content directly
  if (context.forceOverwrite) {
    return {
      relativePath,
      mergedContents: normalizeBufferString(formattedContents),
      generatedContents: normalizeBufferString(formattedContents),
      previousRelativePath,
    };
  }

  // If we haven't modified the generated version of the file,
  // we use the previous working file version
  const previousGeneratedBuffer =
    await previousGeneratedPayload?.fileReader.readFile(
      previousRelativePath ?? relativePath,
    );

  if (
    previousGeneratedBuffer &&
    areBufferStringsEqual(previousGeneratedBuffer, formattedContents)
  ) {
    return {
      relativePath,
      mergedContents: undefined, // use the previous working file version
      generatedContents: normalizeBufferString(formattedContents),
      previousRelativePath,
    };
  }

  const previousWorkingBuffer = await previousWorkingCodebase?.readFile(
    previousRelativePath ?? relativePath,
  );
  const currentGeneratedBuffer = normalizeBufferString(formattedContents);

  // If there is no previous working file, we use the generated file
  if (!previousRelativePath || !previousWorkingBuffer) {
    return {
      relativePath,
      mergedContents: currentGeneratedBuffer,
      generatedContents: currentGeneratedBuffer,
      // If there is a previous generated file, the file was deleted in the
      // working codebase but modified in the generated codebase so should be flagged as a conflict
      deletedInWorking:
        previousGeneratedBuffer !== undefined && !previousWorkingBuffer
          ? true
          : undefined,
      previousRelativePath,
    };
  }

  // If the previous working file is identical to the generated file, we don't
  // need to change anything
  if (previousWorkingBuffer.equals(currentGeneratedBuffer)) {
    return {
      relativePath,
      mergedContents: undefined, // use the previous working file version
      generatedContents: normalizeBufferString(formattedContents),
      previousRelativePath,
    };
  }

  // Otherwise, we merge the contents
  const mergeInput: MergeContentsInput = {
    relativePath,
    data: { ...data, contents: formattedContents },
    previousRelativePath,
    previousGeneratedBuffer,
    previousWorkingBuffer,
    context,
  };

  return Buffer.isBuffer(formattedContents)
    ? mergeBufferContents(mergeInput)
    : mergeStringContents(mergeInput);
}
