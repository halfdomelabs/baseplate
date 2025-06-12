import type { z } from 'zod';

import { readJsonWithSchema } from '@baseplate-dev/utils/node';
import { globby } from 'globby';
import fsAdapter from 'node:fs';
import path from 'node:path/posix';

import type {
  ExtractorConfig,
  TemplateConfig,
} from './extractor-config.schema.js';

import { extractorConfigSchema } from './extractor-config.schema.js';
import { extractorProvidersConfigSchema } from './providers-config.schema.js';

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

export interface TemplateExtractorTemplateEntry<
  TConfig = Record<string, unknown>,
> {
  config: TConfig;
  path: string;
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

  constructor(
    private readonly packageMap: Map<string, string>,
    private readonly fileIdMap: Map<string, string>,
  ) {}

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
  ): TemplateExtractorTemplateEntry<z.infer<T>>[] {
    const config = this.getExtractorConfigOrThrow(generatorName);
    const { templates } = config.config;
    return Object.entries(templates)
      .filter(([, template]) => template.type === templateType)
      .map(([path, template]) => ({
        path,
        config: generatorTemplateMetadataSchema.parse(template) as z.infer<T>,
      }));
  }

  getGeneratorConfigsForExtractorType<
    TTemplateMetadata extends z.ZodTypeAny,
    TGeneratorConfig extends z.ZodTypeAny = z.ZodNever,
  >(
    templateType: z.infer<TTemplateMetadata>['type'],
    templateMetadataSchema: TTemplateMetadata,
    generatorConfigSchema?: TGeneratorConfig,
  ): {
    generatorName: string;
    generatorDirectory: string;
    packageName: string;
    packagePath: string;
    templates: Record<string, z.infer<TTemplateMetadata>>;
    config: z.infer<TGeneratorConfig>;
  }[] {
    return [...this.extractorConfigCache.entries()].map(
      ([generatorName, config]) => {
        const generatorConfig = generatorConfigSchema
          ? (generatorConfigSchema.parse(
              config.config,
            ) as z.infer<TGeneratorConfig>)
          : undefined;
        const templates = Object.fromEntries(
          Object.entries(config.config.templates)
            .filter(([, template]) => template.type === templateType)
            .map(([path, template]) => {
              const metadata = templateMetadataSchema.parse(
                template,
              ) as z.infer<TTemplateMetadata>;
              return [path, metadata];
            }),
        );
        return {
          generatorName,
          generatorDirectory: config.generatorDirectory,
          packageName: config.packageName,
          packagePath: config.packagePath,
          templates,
          config: generatorConfig,
        };
      },
    );
  }

  getOutputRelativePathForTemplate(
    generatorName: string,
    templateName: string,
  ): string | undefined {
    const fileId = `${generatorName}:${templateName}`;
    return this.fileIdMap.get(fileId);
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

  /**
   * Update the template config for a generator
   * @param generatorName - The name of the generator
   * @param config - The template config to update
   */
  updateExtractorTemplateConfig(
    generatorName: string,
    config: TemplateConfig,
  ): void {
    this.checkInitialized();

    const existingEntry = this.extractorConfigCache.get(generatorName);
    if (!existingEntry) {
      throw new Error(`Generator ${generatorName} not found`);
    }

    const { templates } = existingEntry.config;

    const templateKey = Object.keys(templates).find(
      (key) => templates[key].name === config.name,
    );

    if (!templateKey) {
      throw new Error(
        `Template ${config.name} not found in generator ${generatorName}`,
      );
    }

    templates[templateKey] = config;
  }

  /**
   * Get plugin configuration for a specific generator
   * @param generatorName - The name of the generator
   * @param pluginName - The name of the plugin
   * @param schema - Zod schema to validate and parse the plugin configuration
   * @returns The parsed plugin configuration or undefined if not found
   */
  getPluginConfigForGenerator<T extends z.ZodTypeAny>(
    generatorName: string,
    pluginName: string,
    schema: T,
  ): z.infer<T> | undefined {
    this.checkInitialized();

    const config = this.getExtractorConfig(generatorName);
    if (!config?.config.plugins) {
      return undefined;
    }

    if (!(pluginName in config.config.plugins)) {
      return undefined;
    }

    const pluginConfig = config.config.plugins[pluginName];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- pluginConfig is validated by the schema
    return schema.parse(pluginConfig) as z.infer<T>;
  }

  /**
   * Get extractor configuration for a specific generator
   * @param generatorName - The name of the generator
   * @param extractorType - The type of extractor
   * @param schema - Zod schema to validate and parse the extractor configuration
   * @returns The parsed extractor configuration or undefined if not found
   */
  getExtractorConfigForGenerator<T extends z.ZodTypeAny>(
    generatorName: string,
    extractorType: string,
    schema: T,
  ): z.infer<T> | undefined {
    this.checkInitialized();

    const config = this.getExtractorConfig(generatorName);
    if (!config?.config.extractors) {
      return undefined;
    }

    if (!(extractorType in config.config.extractors)) {
      return undefined;
    }

    const extractorConfig = config.config.extractors[extractorType];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- extractorConfig is validated by the schema
    return schema.parse(extractorConfig) as z.infer<T>;
  }
}
