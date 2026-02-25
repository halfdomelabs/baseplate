import {
  handleFileNotFoundError,
  readJsonWithSchema,
  writeStablePrettyJson,
} from '@baseplate-dev/utils/node';
import { mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { z } from 'zod';

/**
 * Schema for validating user configuration stored in ~/.baseplate/config.json
 * This configuration allows users to persist preferences across sessions.
 */
export const userConfigSchema = z
  .object({
    sync: z
      .object({
        /**
         * Whether to write the generator steps JSON file
         */
        writeGeneratorStepsJson: z.boolean().optional().default(false),
        /**
         * The merge driver to use following the custom merge driver command for custom Git merge drivers
         * instead of the default 3-way merge driver.
         *
         * See https://git-scm.com/docs/gitattributes#_defining_a_custom_merge_driver
         */
        customMergeDriver: z.string().optional(),
        /**
         * Editor to open when the user clicks on a file with conflicts
         */
        editor: z.string().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type BaseplateUserConfig = z.infer<typeof userConfigSchema>;

function getConfigPath(): string {
  const homeDir = os.homedir();
  return path.join(homeDir, '.baseplate', 'config.json');
}

/**
 * Get the user config for the project builder.
 *
 * @returns The user config for the project builder.
 */
export async function getUserConfig(): Promise<BaseplateUserConfig> {
  const configPath = getConfigPath();
  const config = await readJsonWithSchema(configPath, userConfigSchema).catch(
    handleFileNotFoundError,
  );
  return config ?? {};
}

/**
 * Write the user config for the project builder.
 *
 * @param config - The user config to write.
 */
export async function writeUserConfig(
  config: BaseplateUserConfig,
): Promise<void> {
  const configPath = getConfigPath();
  const configDir = path.dirname(configPath);
  await mkdir(configDir, { recursive: true });
  await writeStablePrettyJson(configPath, config);
}
