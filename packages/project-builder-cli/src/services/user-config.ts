import type { BaseplateUserConfig } from '@halfdomelabs/project-builder-server';

import { userConfigSchema } from '@halfdomelabs/project-builder-server';
import {
  handleFileNotFoundError,
  readJsonWithSchema,
} from '@halfdomelabs/utils/node';
import os from 'node:os';
import path from 'node:path';

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
