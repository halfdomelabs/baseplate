import type {
  TemplateExtractorHook,
  TemplateExtractorPlugin,
  TemplateExtractorPluginApi,
} from '../runner/template-extractor-plugin.js';

import { TemplateExtractorContext } from '../runner/template-extractor-context.js';

/**
 * Mock API for testing plugin hook registration
 */
export function createMockPluginApi(): {
  api: TemplateExtractorPluginApi;
  getRegisteredHooks: () => Map<
    TemplateExtractorHook,
    (() => void | Promise<void>)[]
  >;
  executeHooks: (hook: TemplateExtractorHook) => Promise<void>;
} {
  const registeredHooks = new Map<
    TemplateExtractorHook,
    (() => void | Promise<void>)[]
  >();

  const api: TemplateExtractorPluginApi = {
    registerHook(hook, callback) {
      const callbacks = registeredHooks.get(hook) ?? [];
      callbacks.push(callback);
      registeredHooks.set(hook, callbacks);
    },
  };

  return {
    api,
    getRegisteredHooks: () => registeredHooks,
    executeHooks: async (hook) => {
      const callbacks = registeredHooks.get(hook) ?? [];
      for (const callback of callbacks) {
        await callback();
      }
    },
  };
}

/**
 * Creates a plugin instance for testing
 */
export async function createPluginInstance<T>(
  plugin: TemplateExtractorPlugin<string, T>,
  context: TemplateExtractorContext,
  api?: TemplateExtractorPluginApi,
): Promise<{
  instance: T;
  api: TemplateExtractorPluginApi;
  executeHooks: (hook: TemplateExtractorHook) => Promise<void>;
}> {
  const mockApi = api ?? createMockPluginApi();
  const pluginApi = 'api' in mockApi ? mockApi.api : mockApi;

  const instance = await plugin.getInstance({
    context,
    api: pluginApi,
  });

  const executeHooks =
    'executeHooks' in mockApi
      ? mockApi.executeHooks
      : async () => {
          // No-op for external APIs
        };

  return {
    instance,
    api: pluginApi,
    executeHooks,
  };
}

/**
 * Helper to test plugin with dependencies
 */
export async function createPluginInstanceWithDependencies<T>(
  plugin: TemplateExtractorPlugin<string, T>,
  context: TemplateExtractorContext,
  dependencyInstances: Map<string, unknown>,
): Promise<{
  instance: T;
  api: TemplateExtractorPluginApi;
  executeHooks: (hook: TemplateExtractorHook) => Promise<void>;
}> {
  // Add dependency instances to context
  const mergedPlugins = new Map([...context.plugins, ...dependencyInstances]);

  const contextWithDependencies = new TemplateExtractorContext({
    configLookup: context.configLookup,
    logger: context.logger,
    outputDirectory: context.outputDirectory,
    fileContainer: context.fileContainer,
    plugins: mergedPlugins,
  });

  return createPluginInstance(plugin, contextWithDependencies);
}
