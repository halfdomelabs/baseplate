import type { z } from 'zod';

import { readJsonWithSchema } from '@baseplate-dev/utils/node';
import { globby } from 'globby';
import fsAdapter from 'node:fs';
import path from 'node:path/posix';

import type { ExtractorConfig } from './index.js';

import {
  extractorConfigSchema,
  extractorProvidersConfigSchema,
} from './index.js';

export interface TemplateExtractorGeneratorEntry {
  config: ExtractorConfig;
  generatorDirectory: string;
  packageName: string;
  packagePath: string;
}

export interface TemplateExtractorProviderEntry<
  TConfig = Record<string, unknown>,
> {
  config: TConfig;
  packagePathSpecifier: string;
  providerName: string;
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
  private initialized = false;

  constructor(private readonly packageMap: Map<string, string>) {}

  private checkInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        'TemplateExtractorConfigLookup must be initialized before use',
      );
    }
  }

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
        const relativePath = path.join(
          path.relative(packagePath, providerDirectory),
          fileName,
        );
        this.providersConfigCache.set(`${packageName}:${providerName}`, {
          config: providerConfig,
          packagePathSpecifier: `${packageName}:${relativePath}`,
          providerName,
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

    try {
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
          gitignore: true,
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
    } catch (error) {
      throw new Error(
        `Failed to index package ${packageName}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Initialize the lookup service by indexing all packages in the package map
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const errors: Error[] = [];
    await Promise.all(
      [...this.packageMap.keys()].map(async (name) => {
        try {
          await this.indexPackage(name);
        } catch (error) {
          errors.push(
            error instanceof Error ? error : new Error(String(error)),
          );
        }
      }),
    );

    if (errors.length > 0) {
      throw new Error(
        `Failed to initialize packages: ${errors.map((e) => e.message).join(', ')}`,
      );
    }

    this.initialized = true;
  }

  /**
   * Get the extractor config for a generator
   */
  getExtractorConfig(
    generatorName: string,
  ): TemplateExtractorGeneratorEntry | undefined {
    this.checkInitialized();
    return this.extractorConfigCache.get(generatorName);
  }

  getExtractorConfigOrThrow(
    generatorName: string,
  ): TemplateExtractorGeneratorEntry {
    const config = this.getExtractorConfig(generatorName);
    if (!config) {
      throw new Error(`Generator ${generatorName} not found`);
    }
    return config;
  }

  getTemplatesForGenerator<T extends z.ZodTypeAny>(
    generatorName: string,
    generatorTemplateMetadataSchema: T,
    templateType: z.infer<T>['type'],
  ): { path: string; config: z.infer<T> }[] {
    const config = this.getExtractorConfigOrThrow(generatorName);
    const { templates } = config.config;
    return Object.entries(templates)
      .filter(([, template]) => template.type === templateType)
      .map(([path, template]) => ({
        path,
        config: generatorTemplateMetadataSchema.parse(template) as z.infer<T>,
      }));
  }

  /**
   * Get providers config by the fully-qualified provider name (format: package-name:provider-name)
   */
  getProviderConfigByName(
    providerName: string,
  ): TemplateExtractorProviderEntry | undefined {
    this.checkInitialized();

    if (!providerName.includes(':')) {
      throw new Error(
        `Invalid provider name: ${providerName}. Should be of form "package-name:provider-name"`,
      );
    }

    return this.providersConfigCache.get(providerName);
  }

  /**
   * Get provider configs by type
   */
  getProviderConfigsByType<T extends z.ZodTypeAny>(
    type: z.infer<T>['type'],
    providerConfigSchema: T,
  ): TemplateExtractorProviderEntry<z.infer<T>>[] {
    this.checkInitialized();

    return [...this.providersConfigCache.values()]
      .filter((cached) => cached.config.type === type)
      .map((cached) => {
        const parsed = providerConfigSchema.parse(cached.config) as z.infer<T>;
        return {
          ...cached,
          config: parsed,
        };
      });
  }

  /**
   * Write a new extractor config to the cache, reusing existing package info if available
   */
  setExtractorConfig(generatorName: string, config: ExtractorConfig): void {
    this.checkInitialized();

    const existingEntry = this.extractorConfigCache.get(generatorName);
    if (!existingEntry) {
      throw new Error(
        `Cannot update extractor config for ${generatorName}: generator not found in cache. Please ensure the generator exists before updating.`,
      );
    }

    this.extractorConfigCache.set(generatorName, {
      config,
      generatorDirectory: existingEntry.generatorDirectory,
      packageName: existingEntry.packageName,
      packagePath: existingEntry.packagePath,
    });
  }
}
