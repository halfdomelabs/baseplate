import { z } from 'zod';

import { PluginSpecImplementation, createPluginSpec } from './types.js';

/**
 * Spec for registering plugin config schema
 */
export interface PluginConfigSpec extends PluginSpecImplementation {
  registerSchema: (pluginId: string, schema: z.ZodTypeAny) => void;
  getSchema(pluginId: string): z.ZodTypeAny | undefined;
}

export function createPluginConfigImplementation(): PluginConfigSpec {
  const schemas: Record<string, z.ZodTypeAny> = {};

  return {
    registerSchema(pluginId, schema) {
      if (schemas[pluginId]) {
        throw new Error(`Schema for plugin ${pluginId} is already registered`);
      }
      schemas[pluginId] = schema;
    },
    getSchema(pluginId) {
      return schemas[pluginId];
    },
  };
}

/**
 * Spec for adding config for the plugin in the core plugin e.g.
 * {
 *  "plugins": [{
 *    "id": "...",
 *    "config": {
 *       ...PluginConfig schema
 *    }
 *  }]
 * }
 */
export const pluginConfigSpec = createPluginSpec('core/plugin-config', {
  defaultInitializer: createPluginConfigImplementation,
});
