import { z } from 'zod';

// matches semver
const versionSchema = z.string().regex(/^(\d+\.\d+\.\d+)$/);

export const pluginSpecSupportSchema = z.object({
  spec: z.string().min(1),
  version: z.string().min(1),
});

export type PluginSpecSupport = z.infer<typeof pluginSpecSupportSchema>;

export const pluginSpecDependencySchema = z.object({
  spec: z.string(),
  version: z.string(),
});

export type PluginSpecDependency = z.infer<typeof pluginSpecDependencySchema>;

/**
 * Schema for the plugin's metadata (plugin.json)
 */
export const pluginMetadataSchema = z.object({
  /**
   * The name of the plugin - must be lowercase and contain only letters, numbers, and hyphens
   */
  name: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  /**
   * A list of directories with entrypoints in them. Defaults to ['.']
   */
  moduleDirectories: z.array(z.string()).optional(),
  /**
   * The display name of the plugin
   */
  displayName: z.string().min(1),
  /**
   * The icon to display for the plugin as a pointer to the icon in the plugin's static folder
   */
  icon: z.string().optional(),
  /**
   * A description of the plugin
   */
  description: z.string(),
  /**
   * The fully qualified name of the plugin that manages this plugin,
   * e.g. "@baseplate-dev/plugin-auth:auth0" would be managed by the "@baseplate-dev/plugin-auth:auth" plugin.
   *
   * Managed plugins do not appear in the plugin list but are managed by the base plugin. If the base
   * plugin is disabled, the managed plugins will also be disabled.
   */
  managedBy: z.string().optional(),
  /**
   * The version of the plugin using semver
   */
  version: versionSchema,
  /**
   * Configuration for the specs that the plugin exports/depends on
   */
  specs: z
    .object({
      /**
       * The specs that the plugin exports
       */
      exports: z.array(pluginSpecSupportSchema).optional(),
      /**
       * The specs that the plugin depends on
       */
      dependencies: z.array(pluginSpecDependencySchema).optional(),
    })
    .optional(),
  /**
   * Whether the plugin should be hidden in the project builder UI
   *
   * (It can be used once in the definition but cannot be added)
   */
  hidden: z.boolean().optional(),
});

export type PluginMetadata = z.infer<typeof pluginMetadataSchema>;

/**
 * Alias for plugin.json schema - same as pluginMetadataSchema
 */
export const pluginJsonSchema = pluginMetadataSchema;
export type PluginJson = PluginMetadata;

export interface PluginMetadataWithPaths extends PluginMetadata {
  /**
   * The unique key of the plugin generated for the project (URL-safe, globally unique)
   */
  key: string;
  /**
   * The name of the plugin package
   */
  packageName: string;
  /**
   * The fully qualified name of the plugin, e.g. "@baseplate-dev/plugin-auth:auth0"
   */
  fullyQualifiedName: string;
  /**
   * The path to the plugin directory
   */
  pluginDirectory: string;
  /**
   * The path to the web build directory for the plugin
   */
  webBuildDirectory: string;
  /**
   * Absolute paths to the node modules
   */
  nodeModulePaths: string[];
  /**
   * Relative imports of available web modules
   */
  webModulePaths: string[];
}
