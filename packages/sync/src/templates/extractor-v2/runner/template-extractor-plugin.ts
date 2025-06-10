import type { TemplateExtractorContext } from './template-extractor-context.js';

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
 * - `afterExtract` - Called after the template extractor has written the template files and extracted the metadata.
 * - `afterWrite` - Called after the template extractor has written generated typed template files.
 *
 * Note: Hooks are executed in reverse dependency order so if plugin A depends on B,
 * B will run after A.
 */
export type TemplateExtractorHook = 'afterExtract' | 'afterWrite';

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
    api: TemplateExtractorPluginApi;
  }): TInstance | Promise<TInstance>;
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

export type TemplateExtractorPluginInstance<
  TPlugin extends TemplateExtractorPlugin,
> = Awaited<ReturnType<TPlugin['getInstance']>>;
