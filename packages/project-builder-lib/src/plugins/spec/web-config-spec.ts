import type React from 'react';

import type { BasePluginDefinition } from '#src/schema/index.js';

import type { PluginMetadataWithPaths } from '../metadata/types.js';
import type { PluginSpecImplementation } from './types.js';

import { createPluginSpec } from './types.js';

export interface WebConfigProps {
  definition: BasePluginDefinition | undefined;
  metadata: PluginMetadataWithPaths;
  onSave: () => void;
}

/**
 * Spec for allowing the plugin to be configured from the plugins page
 */
export interface WebConfigSpec extends PluginSpecImplementation {
  registerWebConfigComponent: (
    pluginKey: string,
    ConfigComponent: React.FC<WebConfigProps>,
  ) => void;
  getWebConfigComponent: (
    pluginKey: string,
  ) => React.FC<WebConfigProps> | undefined;
}

export function createWebConfigImplementation(): WebConfigSpec {
  const components = new Map<string, React.FC<WebConfigProps>>();

  return {
    registerWebConfigComponent(pluginKey, ConfigComponent) {
      if (components.has(pluginKey)) {
        throw new Error(
          `Web config component for plugin ${pluginKey} is already registered`,
        );
      }
      components.set(pluginKey, ConfigComponent);
    },
    getWebConfigComponent(pluginKey) {
      return components.get(pluginKey);
    },
  };
}

/**
 * Spec for adding config component for plugin
 */
export const webConfigSpec = createPluginSpec('core/web-config', {
  platforms: 'web',
  defaultInitializer: createWebConfigImplementation,
});
