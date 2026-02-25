import z from 'zod';

const envConfigSchema = z.object({
  PROJECT_DIRECTORIES: z.string().optional(),
  EXCLUDE_EXAMPLES: z.coerce.boolean().optional(),
  EXAMPLES_DIRECTORIES: z.string().optional(),
  PLUGIN_ROOT_DIRECTORIES: z.string().optional(),
});

type EnvConfig = z.infer<typeof envConfigSchema>;

export function getEnvConfig(): EnvConfig {
  return envConfigSchema.parse(process.env);
}
