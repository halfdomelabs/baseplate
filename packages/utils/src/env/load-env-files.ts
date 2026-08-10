import path from 'node:path';

import { handleFileNotFoundError } from '../fs/handle-not-found-error.js';

/**
 * Env files to load, in load order. `process.loadEnvFile` never overwrites an
 * existing `process.env` value, so the first file to define a key wins and
 * `.env.local` must be listed before `.env` to override it.
 */
const ENV_FILENAMES = ['.env.local', '.env'];

/**
 * Loads `.env.local` and `.env` from a directory into `process.env`.
 *
 * Missing files are ignored. Variables already set in the environment take
 * precedence over file values.
 *
 * @param cwd - Directory to load env files from. Defaults to the current working directory.
 */
export function loadEnvFiles(cwd: string = process.cwd()): void {
  for (const filename of ENV_FILENAMES) {
    try {
      process.loadEnvFile(path.join(cwd, filename));
    } catch (error) {
      handleFileNotFoundError(error);
    }
  }
}
