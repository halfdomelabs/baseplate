import type { DefinitionSchemaCreator } from '#src/schema/creator/index.js';

import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

/**
 * Spec for registering plugin-contributed schema extensions on the web app
 * config, keyed by plugin key. Each plugin's schema creator is merged into the
 * web app config under `pluginData[pluginKey]`, letting plugins add per-app
 * opt-in settings without editing the core web app schema.
 */
export const webAppSchemaExtensionSpec = createFieldMapSpec(
  'core/web-app-schema-extension',
  (t) => ({
    schemas: t.map<string, DefinitionSchemaCreator>(),
  }),
  {
    use: (values) => ({
      getAllSchemaCreators: () => values.schemas,
    }),
  },
);

/**
 * A web app config with an untyped, plugin-keyed `pluginData` bag.
 *
 * The `pluginData` schema is built dynamically from registered plugin schema
 * creators, so it is statically opaque on `WebAppConfig`. Plugins read their own
 * slice back via {@link getWebAppPluginData}, supplying the type they infer from
 * their registered schema creator. This structural type is intentionally broader
 * than `WebAppConfig` so plugin accessors accept an `app` narrowed only by
 * `type === 'web'` (which does not statically resolve to `WebAppConfig`).
 */
export interface WebAppConfigWithPluginData {
  pluginData?: Record<string, unknown>;
}

/**
 * Reads a plugin's per-app settings slice from a web app config.
 *
 * `pluginData` is validated per-plugin by that plugin's registered schema
 * creator, but is statically untyped here (the merged schema is built at
 * runtime). Callers cast the result to the type they infer from their own schema
 * creator via `def.InferOutput`.
 *
 * @param webApp - The web app config to read from
 * @param pluginKey - The registering plugin's key
 * @returns The plugin's slice, or `undefined` if the app has not opted in
 */
export function getWebAppPluginData(
  webApp: WebAppConfigWithPluginData,
  pluginKey: string,
): unknown {
  return webApp.pluginData?.[pluginKey];
}
