import type { z } from 'zod';

import type { PluginSpecImplementation } from './types.js';

import { createPluginSpec } from './types.js';

/**
 * Spec for registering plugin config schema
 */
export interface PluginConfigSpec extends PluginSpecImplementation {
  registerSchema: (pluginId: string, schema: z.ZodTypeAny) => void;
  getSchema(pluginId: string): z.ZodTypeAny | undefined;
}

export function createPluginConfigImplementation(): PluginConfigSpec {
  const schemas = new Map<string, z.ZodTypeAny>();

  return {
    registerSchema(pluginId, schema) {
      if (schemas.has(pluginId)) {
        throw new Error(`Schema for plugin ${pluginId} is already registered`);
      }
      schemas.set(pluginId, schema);
    },
    getSchema(pluginId) {
      return schemas.get(pluginId);
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
