import type { Logger } from '#src/utils/evented-logger.js';

import type { TemplateExtractorConfigLookup } from '../configs/template-extractor-config-lookup.js';
import type {
  InferTemplateExtractorPluginDependency,
  TemplateExtractorPluginDependencies,
} from './template-extractor-plugin.js';

/**
 * Context passed to TemplateFileExtractor operations.
 */
export class TemplateExtractorContext<
  TPluginDependencies extends
    TemplateExtractorPluginDependencies = TemplateExtractorPluginDependencies,
> {
  constructor({
    configLookup,
    logger,
    outputDirectory,
    plugins,
  }: {
    configLookup: TemplateExtractorConfigLookup;
    logger: Logger;
    outputDirectory: string;
    plugins: Map<string, unknown>;
  }) {
    this.configLookup = configLookup;
    this.logger = logger;
    this.outputDirectory = outputDirectory;
    this.plugins = plugins;
  }

  getPlugin<TName extends TPluginDependencies[number]['name']>(
    name: TName,
  ): InferTemplateExtractorPluginDependency<TPluginDependencies, TName> {
    const plugin = this.plugins.get(name) as
      | InferTemplateExtractorPluginDependency<TPluginDependencies, TName>
      | undefined;
    if (!plugin) {
      throw new Error(`Extractor plugin ${name} not found`);
    }
    return plugin;
  }

  /**
   * A map of generator name to its info.
   */
  configLookup: TemplateExtractorConfigLookup;

  /**
   * The logger to use.
   */
  logger: Logger;

  /**
   * The output directory of the package.
   */
  outputDirectory: string;

  /**
   * The plugins available to the context.
   */
  plugins: Map<string, unknown>;
}
