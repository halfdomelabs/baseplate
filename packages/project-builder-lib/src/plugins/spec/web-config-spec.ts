import type React from 'react';

import type { BasePlugin } from '#src/schema/index.js';

import type { PluginMetadataWithPaths } from '../metadata/types.js';
import type { PluginSpecImplementation } from './types.js';

import { createPluginSpec } from './types.js';

export interface WebConfigProps {
  definition: BasePlugin | null;
  metadata: PluginMetadataWithPaths;
  onSave: () => void;
}

/**
 * Spec for allowing the plugin to be configured from the plugins page
 */
export interface WebConfigSpec extends PluginSpecImplementation {
  registerWebConfigComponent: (
    pluginId: string,
    ConfigComponent: React.FC<WebConfigProps>,
  ) => void;
  getWebConfigComponent: (
    pluginId: string,
  ) => React.FC<WebConfigProps> | undefined;
}

export function createWebConfigImplementation(): WebConfigSpec {
  const components = new Map<string, React.FC<WebConfigProps>>();

  return {
    registerWebConfigComponent(pluginId, ConfigComponent) {
      if (components.has(pluginId)) {
        throw new Error(
          `Web config component for plugin ${pluginId} is already registered`,
        );
      }
      components.set(pluginId, ConfigComponent);
    },
    getWebConfigComponent(pluginId) {
      return components.get(pluginId);
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
