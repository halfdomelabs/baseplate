import type { PluginStore } from '@src/plugins/imports/types.js';

/**
 * The context available to the schema parser, including the plugin store.
 */
export interface SchemaParserContext {
  pluginStore: PluginStore;
}
