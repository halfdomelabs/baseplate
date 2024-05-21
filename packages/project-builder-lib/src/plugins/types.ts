import { z } from 'zod';

export const pluginSpecSupportSchema = z.object({
  spec: z.string(),
  version: z.string(),
});

export type PluginSpecSupport = z.infer<typeof pluginSpecSupportSchema>;

export const pluginSpecDependencySchema = z.object({
  spec: z.string(),
  version: z.string(),
});

export type PluginSpecDependency = z.infer<typeof pluginSpecDependencySchema>;

export const pluginConfigSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  icon: z.string().optional(),
  description: z.string(),
  version: z.string(),
  supports: z.array(pluginSpecSupportSchema).optional(),
  dependencies: z.array(pluginSpecDependencySchema).optional(),
  nodeImport: z.string().optional(),
  webEntryImport: z.string().optional(),
});

export type PluginConfig = z.infer<typeof pluginConfigSchema>;

export type PluginConfigWithModule = PluginConfig & {
  moduleName: string;
};
