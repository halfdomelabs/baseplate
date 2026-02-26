import z from 'zod';

const envConfigSchema = z.object({
  PROJECT_DIRECTORIES: z.string().optional(),
});

type EnvConfig = z.infer<typeof envConfigSchema>;

export function getEnvConfig(): EnvConfig {
  return envConfigSchema.parse(process.env);
}
