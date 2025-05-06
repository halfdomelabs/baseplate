// src/git-merge-driver.ts

import { enhanceErrorWithContext } from '@halfdomelabs/utils';
import { execa, ExecaError, parseCommandString } from 'execa';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type {
  StringMergeAlgorithm,
  StringMergeAlgorithmInput,
  StringMergeResult,
} from './types.js';

/**
 * Configuration for a Git merge driver to be used by the generator.
 */
export interface GitMergeDriverConfig {
  /**
   * A human-readable name for the merge driver (used for logging/debugging).
   */
  name: string;
  /**
   * The command template to execute the merge driver.
   * It should include placeholders like %O (base), %A (ours/current), %B (theirs/other).
   * See Git documentation for `merge.driver` configuration for all placeholders.
   * Example: 'my-custom-merge %O %A %B'
   * Example: '/usr/bin/diff3 -m %A %O %B > %A' (Simulates diff3 merge, writing to %A)
   *
   * See https://git-scm.com/docs/gitattributes#_defining_a_custom_merge_driver
   */
  driver: string;
  /**
   * Optional: The conflict marker size to pass via %L. Defaults to 7.
   */
  conflictMarkerSize?: number;
  /**
   * Optional: Label for the base version (%S). Defaults to 'BASE'.
   */
  labelBase?: string;
  /**
   * Optional: Label for the other/theirs version (%X). Defaults to 'BASEPLATE'.
   */
  labelOther?: string;
  /**
   * Optional: Label for the current/ours version (%Y). Defaults to 'CURRENT'.
   */
  labelCurrent?: string;
}

/**
 * Generates a StringMergeAlgorithm that uses an external Git merge driver.
 *
 * @param config - Configuration for the Git merge driver.
 * @returns A StringMergeAlgorithm function.
 */
export const gitMergeDriverAlgorithmGenerator =
  (config: GitMergeDriverConfig): StringMergeAlgorithm =>
  // Return the actual merge algorithm function
  async (input: StringMergeAlgorithmInput): Promise<StringMergeResult> => {
    let tempDir: string | undefined;
    const tempFilePrefix = `merge-${config.name.replaceAll(/[^a-zA-Z0-9]/g, '-')}`;
    const fileExtension = path.extname(input.filePath);
    const fileBase = `base${fileExtension}`;
    const fileCurrent = `current${fileExtension}`; // %A - Driver is expected to write result here
    const fileOther = `other${fileExtension}`;

    try {
      // 1. Create a unique temporary directory
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `${tempFilePrefix}-`));

      // 2. Define file paths
      const basePath = path.join(tempDir, fileBase); // %O
      const currentPath = path.join(tempDir, fileCurrent); // %A
      const otherPath = path.join(tempDir, fileOther); // %B
      const outputPath = path.join(tempDir, fileCurrent); // %P

      // 3. Write input strings to temporary files
      await Promise.all([
        fs.writeFile(basePath, input.previousGeneratedText, 'utf8'), // Base
        fs.writeFile(currentPath, input.previousWorkingText, 'utf8'), // Ours/Current (%A)
        fs.writeFile(otherPath, input.currentGeneratedText, 'utf8'), // Theirs/Other (%B)
      ]);

      // 4. Construct the command
      const markerSize = (config.conflictMarkerSize ?? 7).toString();
      const labelBase = config.labelBase ?? 'BASE';
      const labelCurrent = config.labelCurrent ?? 'CURRENT'; // %X
      const labelOther = config.labelOther ?? 'BASEPLATE'; // %Y

      const command = config.driver
        .replaceAll('%O', basePath)
        .replaceAll('%A', currentPath)
        .replaceAll('%B', otherPath)
        .replaceAll('%P', outputPath)
        .replaceAll('%L', markerSize)
        .replaceAll('%S', labelBase) // Placeholder for base label (undocumented but sometimes used)
        .replaceAll('%X', labelCurrent) // Placeholder for current label
        .replaceAll('%Y', labelOther); // Placeholder for other label

      let exitCode: number | string = 0;

      try {
        const [file, ...commandArguments] = parseCommandString(command);

        await execa(file, commandArguments);
        // Exit code 0 implies success (no conflicts reported by driver)
      } catch (error: unknown) {
        // Check if it's an execution error with an exit code
        if (error instanceof ExecaError) {
          exitCode = error.exitCode ?? 'unknown';
          // Non-zero exit code implies conflict or failure
          // Git specifies non-zero for conflict, >128 for crash/signal
          if (typeof exitCode !== 'number' || exitCode > 128) {
            throw new Error(
              `Git merge driver '${config.name}' crashed or failed with exit code ${exitCode}: ${error.message}`,
            );
          }
          // Otherwise, assume non-zero means conflict (exit codes 1-128)
        } else {
          // Other errors (e.g., command not found, permission denied)
          throw enhanceErrorWithContext(
            error,
            `Failed to execute git merge driver '${config.name}'`,
          );
        }
      }

      // 6. Read the result from the file designated by %A
      const mergedText = await fs.readFile(currentPath, 'utf8');

      // 7. Determine conflict status
      // A non-zero exit code reliably indicates conflict *reported by the driver*.
      // However, some drivers might exit 0 but still insert markers (like default git merge).
      // So, we check both exit code and content.
      const hasConflict = exitCode !== 0 || mergedText.includes('<<<<<<<');

      return {
        mergedText,
        hasConflict,
      };
    } catch (error) {
      throw enhanceErrorWithContext(
        error,
        `Error during git merge driver process for '${config.name}'`,
      );
    } finally {
      // 8. Clean up temporary directory
      if (tempDir) {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    }
  };
