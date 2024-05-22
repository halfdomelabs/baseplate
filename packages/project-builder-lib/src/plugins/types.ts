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

export const pluginConfigSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  icon: z.string().optional(),
  description: z.string(),
  version: versionSchema,
  supports: z.array(pluginSpecSupportSchema).optional(),
  dependencies: z.array(pluginSpecDependencySchema).optional(),
  nodeImport: z.string().optional(),
  webEntryImport: z.string().optional(),
});

export type PluginConfig = z.infer<typeof pluginConfigSchema>;

export type PluginConfigWithModule = PluginConfig & {
  id: string;
  packageName: string;
  pluginDirectory: string;
};
