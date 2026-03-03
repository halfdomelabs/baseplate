import {
  handleFileNotFoundError,
  readJsonWithSchema,
} from '@baseplate-dev/utils/node';
import path from 'node:path';
import { z } from 'zod';

const DEV_CONFIG_FILENAME = 'baseplate.config.json';

const devConfigSchema = z
  .object({
    /**
     * Directory containing example projects (subdirectories are individual examples).
     * Relative to config file location.
     */
    examplesDirectory: z.string().optional(),
    /**
     * Directory containing test projects (subdirectories are individual tests).
     * Relative to config file location.
     */
    testProjectsDirectory: z.string().optional(),
    /**
     * Directories to search for plugins.
     * Relative to config file location.
     */
    pluginRootDirectories: z.array(z.string()).optional().default([]),
  })
  .strict();

export interface ResolvedDevConfig {
  /** Absolute path to the examples directory, or undefined if not configured. */
  examplesDirectory: string | undefined;
  /** Absolute path to the test projects directory, or undefined if not configured. */
  testProjectsDirectory: string | undefined;
  /** Absolute paths to plugin root directories. */
  pluginRootDirectories: string[];
}

const DEFAULT_CONFIG: ResolvedDevConfig = {
  examplesDirectory: undefined,
  testProjectsDirectory: undefined,
  pluginRootDirectories: [],
};

let cachedConfig: ResolvedDevConfig | undefined;

/**
 * Loads the dev config from `baseplate.config.json` in `process.cwd()`.
 *
 * Returns default (empty) config if the file is not found.
 * Throws if the file exists but is invalid.
 * Caches the result for subsequent calls.
 */
export async function loadDevConfig(): Promise<ResolvedDevConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configPath = path.join(process.cwd(), DEV_CONFIG_FILENAME);
  const rawConfig = await readJsonWithSchema(configPath, devConfigSchema).catch(
    handleFileNotFoundError,
  );

  if (!rawConfig) {
    cachedConfig = DEFAULT_CONFIG;
    return cachedConfig;
  }

  const rootDir = process.cwd();

  cachedConfig = {
    examplesDirectory: rawConfig.examplesDirectory
      ? path.resolve(rootDir, rawConfig.examplesDirectory)
      : undefined,
    testProjectsDirectory: rawConfig.testProjectsDirectory
      ? path.resolve(rootDir, rawConfig.testProjectsDirectory)
      : undefined,
    pluginRootDirectories: rawConfig.pluginRootDirectories.map((dir) =>
      path.resolve(rootDir, dir),
    ),
  };

  return cachedConfig;
}
