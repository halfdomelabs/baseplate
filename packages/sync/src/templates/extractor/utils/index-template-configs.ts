import { readJsonWithSchema } from '@baseplate-dev/utils/node';
import { globby } from 'globby';
import fsAdapter from 'node:fs';
import path from 'node:path/posix';

import type { ExtractorConfig } from '../configs/extractor-config.schema.js';

import {
  EXTRACTOR_CONFIG_FILENAME,
  PROVIDERS_CONFIG_FILENAME,
} from '../../constants.js';
import { extractorConfigSchema } from '../configs/extractor-config.schema.js';
import { extractorProvidersConfigSchema } from '../configs/providers-config.schema.js';

export interface ExtractorConfigEntry {
  config: ExtractorConfig;
  generatorDirectory: string;
  packageName: string;
  packagePath: string;
  generatorName: string;
}

export interface ProviderConfigEntry<TConfig = Record<string, unknown>> {
  config: TConfig;
  packagePathSpecifier: string;
  providerName: string;
  packageName: string;
  packagePath: string;
}

export interface TemplateConfigIndexResult {
  extractorEntries: ExtractorConfigEntry[];
  providerEntries: ProviderConfigEntry[];
}

/**
 * Index all extractor.json and providers.json files in a package
 */
async function indexTemplateConfigsInPackage(
  packageName: string,
  packagePath: string,
): Promise<TemplateConfigIndexResult> {
  const configFiles = await globby(
    [
      path.join(packagePath, `src/**/${EXTRACTOR_CONFIG_FILENAME}`),
      path.join(packagePath, `src/**/${PROVIDERS_CONFIG_FILENAME}`),
    ],
    {
      cwd: packagePath,
      absolute: true,
      onlyFiles: true,
      fs: fsAdapter,
      gitignore: true,
    },
  );

  const extractorEntries: ExtractorConfigEntry[] = [];
  const providerEntries: ProviderConfigEntry[] = [];

  for (const configFile of configFiles) {
    if (configFile.endsWith(EXTRACTOR_CONFIG_FILENAME)) {
      const config = await readJsonWithSchema(
        configFile,
        extractorConfigSchema,
      );
      const generatorDirectory = path.dirname(configFile);
      const generatorName = `${packageName}#${config.name}`;

      extractorEntries.push({
        config,
        generatorDirectory,
        packageName,
        packagePath,
        generatorName,
      });
    } else if (configFile.endsWith(PROVIDERS_CONFIG_FILENAME)) {
      const config = await readJsonWithSchema(
        configFile,
        extractorProvidersConfigSchema,
      );
      const providerDirectory = path.dirname(configFile);

      for (const [fileName, providers] of Object.entries(config)) {
        for (const [providerName, providerConfig] of Object.entries(
          providers,
        )) {
          const relativePath = path.join(
            path.relative(packagePath, providerDirectory),
            fileName,
          );
          providerEntries.push({
            config: providerConfig,
            packagePathSpecifier: `${packageName}:${relativePath}`,
            providerName,
            packageName,
            packagePath,
          });
        }
      }
    }
  }

  return { extractorEntries, providerEntries };
}

/**
 * Index all template config files (extractor.json and providers.json) across multiple packages
 */
export async function indexTemplateConfigs(
  packageMap: Map<string, string>,
): Promise<TemplateConfigIndexResult> {
  const allExtractorEntries: ExtractorConfigEntry[] = [];
  const allProviderEntries: ProviderConfigEntry[] = [];
  const errors: Error[] = [];

  await Promise.all(
    [...packageMap.entries()].map(async ([packageName, packagePath]) => {
      try {
        const { extractorEntries, providerEntries } =
          await indexTemplateConfigsInPackage(packageName, packagePath);
        allExtractorEntries.push(...extractorEntries);
        allProviderEntries.push(...providerEntries);
      } catch (error) {
        errors.push(
          error instanceof Error
            ? error
            : new Error(
                `Failed to index package ${packageName}: ${String(error)}`,
              ),
        );
      }
    }),
  );

  if (errors.length > 0) {
    throw new Error(
      `Failed to index some packages: ${errors.map((e) => e.message).join(', ')}`,
    );
  }

  return {
    extractorEntries: allExtractorEntries,
    providerEntries: allProviderEntries,
  };
}
