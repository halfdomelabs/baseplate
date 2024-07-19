import React from 'react';

import { PluginSpecImplementation, createPluginSpec } from './types.js';
import { PluginMetadataWithPaths } from '../metadata/types.js';
import { BasePlugin } from '@src/schema/index.js';

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
  const components: Record<string, React.FC<WebConfigProps>> = {};

  return {
    registerWebConfigComponent(pluginId, ConfigComponent) {
      if (components[pluginId]) {
        throw new Error(
          `Web config component for plugin ${pluginId} is already registered`,
        );
      }
      components[pluginId] = ConfigComponent;
    },
    getWebConfigComponent(pluginId) {
      return components[pluginId];
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
