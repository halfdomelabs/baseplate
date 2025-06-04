import { readJsonWithSchema } from '@baseplate-dev/utils/node';
import { globby } from 'globby';
import fsAdapter from 'node:fs';
import path from 'node:path';

import { parseGeneratorName } from '#src/utils/parse-generator-name.js';

import {
  type ExtractorConfig,
  extractorConfigSchema,
  extractorProvidersConfigSchema,
} from './index.js';

export interface TemplateExtractorGeneratorEntry {
  config: ExtractorConfig;
  generatorDirectory: string;
  packageName: string;
  packagePath: string;
}

export interface TemplateExtractorProviderEntry {
  config: Record<string, unknown>;
  providerFilePath: string;
  packageName: string;
  packagePath: string;
}

/**
 * Config lookup service for finding and caching extractor.json and providers.json files
 */
export class TemplateExtractorConfigLookup {
  private extractorConfigCache = new Map<
    string,
    TemplateExtractorGeneratorEntry
  >();
  private providersConfigCache = new Map<
    string,
    TemplateExtractorProviderEntry
  >();
  private indexedPackages = new Set<string>();

  constructor(private readonly packageMap: Map<string, string>) {}

  private async indexExtractorConfig(
    packageName: string,
    packagePath: string,
    filePath: string,
  ): Promise<void> {
    const config = await readJsonWithSchema(filePath, extractorConfigSchema);
    const generatorDirectory = path.dirname(filePath);

    this.extractorConfigCache.set(`${packageName}#${config.name}`, {
      config,
      generatorDirectory,
      packageName,
      packagePath,
    });
  }

  private async indexProviderConfig(
    packageName: string,
    packagePath: string,
    filePath: string,
  ): Promise<void> {
    const config = await readJsonWithSchema(
      filePath,
      extractorProvidersConfigSchema,
    );
    const providerDirectory = path.dirname(filePath);

    for (const [fileName, providers] of Object.entries(config)) {
      for (const [providerName, providerConfig] of Object.entries(providers)) {
        this.providersConfigCache.set(`${packageName}:${providerName}`, {
          config: providerConfig,
          providerFilePath: path.join(providerDirectory, fileName),
          packageName,
          packagePath,
        });
      }
    }
  }

  private async indexPackage(packageName: string): Promise<void> {
    if (this.indexedPackages.has(packageName)) {
      return;
    }

    const packagePath = this.packageMap.get(packageName);
    if (!packagePath) {
      throw new Error(
        `Package ${packageName} not found in package map. Please ensure it is installed and available as a plugin.`,
      );
    }

    const configFiles = await globby(
      [
        path.join(packagePath, '**/extractor.json'),
        path.join(packagePath, '**/providers.json'),
      ],
      {
        cwd: packagePath,
        absolute: true,
        onlyFiles: true,
        fs: fsAdapter,
      },
    );

    for (const configFile of configFiles) {
      if (configFile.endsWith('extractor.json')) {
        await this.indexExtractorConfig(packageName, packagePath, configFile);
      } else if (configFile.endsWith('providers.json')) {
        await this.indexProviderConfig(packageName, packagePath, configFile);
      }
    }

    this.indexedPackages.add(packageName);
  }

  /**
   * Get the extractor config for a generator
   */
  async getExtractorConfig(
    generatorName: string,
  ): Promise<TemplateExtractorGeneratorEntry | undefined> {
    const parsedGeneratorName = parseGeneratorName(generatorName);
    await this.indexPackage(parsedGeneratorName.packageName);

    return this.extractorConfigCache.get(generatorName);
  }

  /**
   * Get providers config by the fully-qualified provider name (format: package-name:provider-name)
   */
  async getProviderConfigByName(
    providerName: string,
  ): Promise<TemplateExtractorProviderEntry | undefined> {
    if (!providerName.includes(':')) {
      throw new Error(
        `Invalid provider name: ${providerName}. Should be of form "package-name:provider-name"`,
      );
    }

    const [packageName] = providerName.split(':');

    await this.indexPackage(packageName);

    return this.providersConfigCache.get(providerName);
  }

  /**
   * Get provider configs by type
   *
   * Note: This does not index the package, so we should have already loaded
   * the appropriate generator packages prior to this operation.
   */
  getProviderConfigsByType(type: string): TemplateExtractorProviderEntry[] {
    return [...this.providersConfigCache.values()].filter(
      (cached) => cached.config.type === type,
    );
  }
}
