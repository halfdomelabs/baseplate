import type { Logger } from '#src/utils/evented-logger.js';

import type { CodebaseFileReader } from '../codebase-file-reader.js';
import type { GeneratorOutputFormatter } from '../formatter.js';
import type { GitMergeDriverConfig } from '../string-merge-algorithms/git-merge-driver.js';

/**
 * Payload for the previously generated codebase
 */
export interface PreviousGeneratedPayload {
  /**
   * Function to read the base generated file contents
   */
  readonly fileReader: CodebaseFileReader;
  /**
   * Map of file IDs to their relative paths
   */
  readonly fileIdToRelativePathMap: Map<string, string>;
}

export interface OverwriteOptions {
  /**
   * Whether to overwrite files without attempting to merge into working codebase.
   */
  enabled: boolean;
  /**
   * Whether to apply snapshots to the generated output.
   *
   * If undefined is returned, we will skip the generation of that file (assume it was purposely deleted)
   *
   * If false is returned, we will apply the standard 3-way merge skipping the overwrite option.
   * Useful if there is an error with the patch application.
   */
  applyDiff?: (
    relativePath: string,
    generatedContents: string | Buffer,
  ) => Promise<string | Buffer | undefined | false>;
  /**
   * Whether to skip the overwrite operation for a particular file.
   */
  skipFile?: (relativePath: string) => boolean;
}

/**
 * Context for the file writer functions
 */
export interface GeneratorOutputFileWriterContext {
  /**
   * Global formatters to use for the file writing
   */
  readonly formatters: GeneratorOutputFormatter[];
  /**
   * Logger to use for the file
   */
  readonly logger: Logger;
  /**
   * Directory to write the file to
   */
  readonly outputDirectory: string;
  /**
   * Previous generated codebase (if any)
   */
  readonly previousGeneratedPayload: PreviousGeneratedPayload | undefined;
  /**
   * Previous working codebase file reader (if any)
   */
  readonly previousWorkingCodebase: CodebaseFileReader | undefined;
  /**
   * A custom merge driver to use instead of the default 3-way merge driver.
   *
   * See https://git-scm.com/docs/gitattributes#_defining_a_custom_merge_driver
   */
  readonly mergeDriver?: GitMergeDriverConfig;
  /**
   * Options for overwriting files.
   */
  readonly overwriteOptions?: OverwriteOptions;
}

/**
 * Generator file operation result
 */
export interface GeneratorFileOperationResult {
  /**
   * Relative path of the file
   */
  relativePath: string;
  /**
   * Previous relative path of the file (if the file was renamed)
   */
  previousRelativePath: string | undefined;
  /**
   * Merged contents of the file (if undefined, the working file version should be used)
   */
  mergedContents: Buffer | undefined;
  /**
   * Generated contents of the file
   */
  generatedContents: Buffer;
  /**
   * The relative path of the file where the generated
   * contents will be written to (in case of a binary conflict)
   */
  generatedConflictRelativePath?: string;
  /**
   * Whether the file has a conflict
   */
  hasConflict?: boolean;
  /**
   * Whether the file was deleted in the working codebase but modified in the generated codebase
   */
  deletedInWorking?: boolean;
}
