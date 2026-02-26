import type { DefinitionSchemaParserContext } from '../schema/creator/types.js';

import { createPluginSpecStore } from '../parser/parser.js';
import { createDefinitionSchemaParserContext } from '../schema/creator/schema-creator.js';

const emptyPluginStore = {
  availablePlugins: [],
  coreModules: [],
};

/**
 * Creates a definition schema parser context with no plugins.
 * Useful for unit tests that need to build or parse definition schemas
 * without a full project context.
 */
export function createEmptyParserContext(): DefinitionSchemaParserContext {
  const pluginSpecStore = createPluginSpecStore(emptyPluginStore, {});
  return createDefinitionSchemaParserContext({ plugins: pluginSpecStore });
}
