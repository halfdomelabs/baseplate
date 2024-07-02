import { z } from 'zod';

export const pluginManifestJsonSchema = z.object({
  plugins: z.array(z.string()),
  webBuild: z.string(),
});

export type PluginManifestJson = z.infer<typeof pluginManifestJsonSchema>;
