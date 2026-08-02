// @ts-nocheck

import { z } from 'zod';

const configSchema = TPL_CONFIG_SCHEMA;

type Config = z.infer<typeof configSchema>;

let cachedConfig: Config | undefined;

/**
 * Returns the validated config, parsing the environment on first use.
 *
 * Avoid calling at module scope: that parses the environment when the module is
 * imported, making the module unusable outside the backend process.
 *
 * @returns The validated config.
 */
export function getConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const result = configSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  cachedConfig = result.data;
  return cachedConfig;
}

/**
 * Returns whether the app is running in the development environment.
 */
export function isDevelopment(): boolean {
  return getConfig().APP_ENVIRONMENT === 'dev';
}
