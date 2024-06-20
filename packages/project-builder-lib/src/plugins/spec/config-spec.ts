// Interfaces for Node / Web entry point

import { z } from 'zod';

import { PluginSpecImplementation, createPluginSpec } from './types.js';

/**
 * Shared Entry point
 */
export interface PluginConfigSpec extends PluginSpecImplementation {
  registerSchema: (pluginId: string, schema: z.AnyZodObject) => void;
  getSchema(pluginId: string): z.AnyZodObject | undefined;
}

export function createPluginConfigImplementation(): PluginConfigSpec {
  const schemas: Record<string, z.AnyZodObject> = {};

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
export const pluginConfigSpec =
  createPluginSpec<PluginConfigSpec>('core/plugin-config');
