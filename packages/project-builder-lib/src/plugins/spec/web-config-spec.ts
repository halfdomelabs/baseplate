import type React from 'react';

import type { BasePluginDefinition } from '#src/schema/index.js';

import type { PluginMetadataWithPaths } from '../metadata/types.js';

import { createFieldMapSpec } from '../utils/create-field-map-spec.js';

export interface WebConfigProps {
  definition: BasePluginDefinition | undefined;
  metadata: PluginMetadataWithPaths;
  onSave: () => void;
}

/**
 * Spec for adding config component for plugin
 *
 * Keyed by plugin key, value is the config component.
 */
export const webConfigSpec = createFieldMapSpec('core/web-config', (t) => ({
  components: t.map<string, React.FC<WebConfigProps>>(),
}));
