import { z } from 'zod';

export const basePluginSchema = z.object({
  packageName: z.string(),
  name: z.string(),
  version: z.string(),
});

export type BasePlugin = z.infer<typeof basePluginSchema>;

export const pluginsSchema = z.array(basePluginSchema);
