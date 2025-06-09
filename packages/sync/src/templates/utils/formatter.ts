import type { Options } from 'prettier';

import {
  format,
  getFileInfo,
  resolveConfig,
  resolveConfigFile,
} from 'prettier';

const prettierConfigs: { path: string; config: Options }[] = [];

const DEFAULT_PRETTIER_CONFIG: Options = {
  tabWidth: 2,
  singleQuote: true,
  trailingComma: 'all',
  semi: true,
};

async function getPrettierConfig(filePath: string): Promise<Options> {
  let cachedConfig: Options | undefined | null = prettierConfigs.find(
    (config) => filePath.startsWith(config.path),
  )?.config;
  if (!cachedConfig) {
    // Look up config
    const configFile = await resolveConfigFile(filePath);
    if (!configFile) {
      return DEFAULT_PRETTIER_CONFIG;
    }
    cachedConfig = await resolveConfig(filePath, { config: configFile });
    if (!cachedConfig) {
      return DEFAULT_PRETTIER_CONFIG;
    }
    prettierConfigs.push({ path: configFile, config: cachedConfig });
  }
  return cachedConfig;
}

/**
 * Formats the contents of a generated template file using Prettier
 *
 * Should only be used for template extraction purposes since it caches the prettier config
 * as a global variable.
 *
 * @param contents The contents of the generated template file
 * @param path The path of the generated template file
 * @returns The formatted contents of the generated template file
 */
export async function formatGeneratedTemplateContents(
  contents: string,
  filePath: string,
): Promise<string> {
  const extension = filePath.split('.').pop();
  const fileInfo = await getFileInfo(filePath);
  if (!extension || fileInfo.inferredParser === null) {
    return contents;
  }
  const config = await getPrettierConfig(filePath);
  return format(contents, { ...config, filepath: filePath });
}
