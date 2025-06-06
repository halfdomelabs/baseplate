import { toposort } from '@baseplate-dev/utils';

import type { TemplateExtractorFileContainer } from './template-extractor-file-container.js';
import type {
  TemplateExtractorPlugin,
  TemplateExtractorPluginApi,
  TemplateExtractorPluginDependencies,
} from './template-extractor-plugin.js';
import type { TemplateFileExtractor } from './template-file-extractor.js';

import { TemplateExtractorContext } from './template-extractor-context.js';

interface InitializeTemplateExtractorPluginsInput {
  templateExtractors: TemplateFileExtractor[];
  context: TemplateExtractorContext;
  fileContainer: TemplateExtractorFileContainer;
}

interface InitializeTemplateExtractorPluginsResult {
  pluginMap: Map<string, unknown>;
  hooks: {
    afterExtract: (() => void | Promise<void>)[];
    afterWrite: (() => void | Promise<void>)[];
  };
}

/**
 * Initializes template extractor plugins by extracting all plugins from template extractors,
 * sorting them by dependencies using topological sort, and initializing them in correct order.
 *
 * @param input - The input object containing template extractors, context, and fileContainer
 * @returns An object containing the plugin map and collected hooks
 */
export async function initializeTemplateExtractorPlugins({
  templateExtractors,
  context,
  fileContainer,
}: InitializeTemplateExtractorPluginsInput): Promise<InitializeTemplateExtractorPluginsResult> {
  // Step 1: Extract all plugins from template extractors recursively
  const allPlugins = extractPluginsRecursively(templateExtractors);

  // Step 2: Sort plugins by dependencies using topological sort
  const sortedPlugins = sortPluginsByDependencies(allPlugins);

  // Step 3: Initialize plugins in dependency order and populate context plugins map
  const initializedPlugins = new Map<string, unknown>();
  const allHooks = {
    afterExtract: [] as (() => void | Promise<void>)[],
    afterWrite: [] as (() => void | Promise<void>)[],
  };

  for (const plugin of sortedPlugins) {
    // Create a temporary context with currently initialized plugins for this plugin
    const pluginContext = new TemplateExtractorContext({
      configLookup: context.configLookup,
      logger: context.logger,
      outputDirectory: context.outputDirectory,
      plugins: initializedPlugins,
    });

    // Create plugin API with hooks support
    const pluginApi = createPluginApi(allHooks);

    // Initialize the plugin
    const pluginInstance = await plugin.getInstance({
      context: pluginContext,
      fileContainer,
      api: pluginApi,
    });

    // Add to both our return map and the context's plugins map
    initializedPlugins.set(plugin.name, pluginInstance);
    context.plugins.set(plugin.name, pluginInstance);
  }

  return {
    pluginMap: initializedPlugins,
    hooks: allHooks,
  };
}

/**
 * Extracts all plugins from template extractors and their dependencies recursively.
 */
function extractPluginsRecursively(
  templateExtractors: TemplateFileExtractor[],
): TemplateExtractorPlugin[] {
  const pluginMap = new Map<string, TemplateExtractorPlugin>();
  const visited = new Set<string>();

  function collectPlugins(
    plugins: TemplateExtractorPluginDependencies = [],
  ): void {
    for (const plugin of plugins) {
      if (visited.has(plugin.name)) {
        continue;
      }

      visited.add(plugin.name);
      pluginMap.set(plugin.name, plugin);

      // Recursively collect plugin dependencies
      if (plugin.pluginDependencies) {
        collectPlugins(plugin.pluginDependencies);
      }
    }
  }

  // Collect plugins from all template extractors
  for (const extractor of templateExtractors) {
    if (extractor.pluginDependencies) {
      collectPlugins(extractor.pluginDependencies);
    }
  }

  return [...pluginMap.values()];
}

/**
 * Sorts plugins by their dependencies using topological sort.
 */
function sortPluginsByDependencies(
  plugins: TemplateExtractorPlugin[],
): TemplateExtractorPlugin[] {
  const pluginMap = new Map<string, TemplateExtractorPlugin>();
  for (const plugin of plugins) {
    pluginMap.set(plugin.name, plugin);
  }

  // Create dependency edges: [dependency, dependent] - dependencies come before dependents
  const edges: [string, string][] = [];
  for (const plugin of plugins) {
    if (plugin.pluginDependencies) {
      for (const dependency of plugin.pluginDependencies) {
        edges.push([dependency.name, plugin.name]);
      }
    }
  }

  // Sort plugin names by dependencies
  const sortedNames = toposort(
    plugins.map((p) => p.name),
    edges,
  );

  // Return plugins in sorted order
  return sortedNames.map((name: string) => {
    const plugin = pluginMap.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} not found in plugin map`);
    }
    return plugin;
  });
}

/**
 * Creates a plugin API with hook registration support.
 */
function createPluginApi(allHooks: {
  afterExtract: (() => void | Promise<void>)[];
  afterWrite: (() => void | Promise<void>)[];
}): TemplateExtractorPluginApi {
  return {
    registerHook(
      hook: 'afterExtract' | 'afterWrite',
      callback: () => void | Promise<void>,
    ): void {
      allHooks[hook].push(callback);
    },
  };
}
