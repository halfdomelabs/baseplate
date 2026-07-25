import type React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

export interface WebAppSettingsFormProps {
  // oxlint-disable-next-line typescript/no-explicit-any -- shared web app form, plugins bind their own field paths
  formProps: UseFormReturn<any>;
  pluginKey: string;
}

export interface WebAppSettingsWebConfig {
  pluginKey: string;
  Form: React.ComponentType<WebAppSettingsFormProps>;
}

export function createWebAppSettingsWebConfig(
  config: WebAppSettingsWebConfig,
): WebAppSettingsWebConfig {
  return config;
}

/**
 * Spec for registering plugin-contributed UI on the web app settings page.
 *
 * Keyed by plugin key; each entry supplies a React component rendered in the
 * Features section, bound to the shared web app form. The schema counterpart is
 * `webAppSchemaExtensionSpec`, which stores the values under `pluginData`.
 */
export const webAppSchemaExtensionWebSpec = createFieldMapSpec(
  'core/web-app-schema-extension-web',
  (t) => ({
    configs: t.map<string, WebAppSettingsWebConfig>(),
  }),
);
