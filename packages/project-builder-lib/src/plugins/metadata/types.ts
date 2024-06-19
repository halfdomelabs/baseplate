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
 * Schema for the plugin's metadata
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
});

export type PluginMetadata = z.infer<typeof pluginMetadataSchema>;

export interface PluginMetadataWithPaths extends PluginMetadata {
  /**
   * The unique ID of the plugin generated for the project
   */
  id: string;
  /**
   * The name of the plugin package
   */
  packageName: string;
  /**
   * The path to the plugin directory
   */
  pluginDirectory: string;
  /**
   * The path to the web build directory for the plugin
   */
  webBuildDirectory: string;
}
