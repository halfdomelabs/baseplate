import type { TemplateExtractorContext } from './template-extractor-context.js';
import type { TemplateExtractorFileContainer } from './template-extractor-file-container.js';

/**
 * The dependencies that are required by a plugin.
 */
export type TemplateExtractorPluginDependencies = TemplateExtractorPlugin[];

/**
 * Infer the dependencies from a list of plugins.
 */
export type InferTemplateExtractorPluginDependency<
  TDeps extends TemplateExtractorPluginDependencies,
  TName extends string,
> =
  Extract<
    TDeps[number],
    TemplateExtractorPlugin<TName>
  > extends TemplateExtractorPlugin<TName, infer TInstance>
    ? TInstance
    : never;

/**
 * The hooks that are available to plugins.
 *
 * - `afterExtract` - Called after the template extractor has extracted all the metadata from the output.
 * - `afterWrite` - Called after the template extractor has written all files. (called in reverse order of dependencies so dependencies will run after)
 */
type TemplateExtractorHook = 'afterExtract' | 'afterWrite';

export interface TemplateExtractorPluginApi {
  registerHook(
    hook: TemplateExtractorHook,
    callback: () => void | Promise<void>,
  ): void;
}

/**
 * A plugin for the template extractor that allows meta-functionality
 * like path resolution, barrel imports, etc. across different file extractors.
 */
export interface TemplateExtractorPlugin<
  TName extends string = string,
  TInstance = unknown,
  TPluginDependencies extends
    TemplateExtractorPluginDependencies = TemplateExtractorPluginDependencies,
> {
  name: TName;
  pluginDependencies?: TPluginDependencies;
  getInstance(options: {
    context: TemplateExtractorContext<TPluginDependencies>;
    fileContainer: TemplateExtractorFileContainer;
    api: TemplateExtractorPluginApi;
  }): TInstance;
}

export function createTemplateExtractorPlugin<
  TName extends string = string,
  TInstance = unknown,
  TPluginDependencies extends TemplateExtractorPluginDependencies = [],
>(
  input: TemplateExtractorPlugin<TName, TInstance, TPluginDependencies>,
): TemplateExtractorPlugin<TName, TInstance, TPluginDependencies> {
  return input;
}
