import { z } from 'zod';

/* HOISTED:origin-url-validator:START */
const originUrl = z
  .url({ protocol: /^https?$/ })
  .refine((url) => {
    const parsed = new URL(url);
    return parsed.pathname === '/' && !parsed.search && !parsed.hash;
  }, 'Must be an origin without a path, e.g. https://app.example.com')
  .transform((url) => url.replace(/\/+$/, ''));
/* HOISTED:origin-url-validator:END */

const configSchema = /* TPL_CONFIG_SCHEMA:START */ z.object({
  // Additional origins to trust beyond this project's web apps, comma-separated. For a preview deployment or a marketing site. Each must be an exact origin.
  ADDITIONAL_WEB_ORIGINS: z.string().default(''),
  // Public origin of this backend, used for links a third party has to reach (e.g. https://api.example.com)
  API_URL: originUrl,
  // Environment the app is running in
  APP_ENVIRONMENT: z.enum(['dev', 'test', 'stage', 'prod']),
  // Secret the app derives all signing keys from (at least 32 characters). Never used directly.
  APP_SECRET: z.string().regex(/^[a-zA-Z0-9\-_+=/]{32,}$/),
  // Comma-separated previously-active values of APP_SECRET, in any order. Remove one to invalidate the tokens it signed. Leave empty until the first rotation.
  APP_SECRET_PREVIOUS: z
    .string()
    .default('')
    .refine(
      (value) =>
        value === '' ||
        value
          .split(',')
          .every((entry) => /^[a-zA-Z0-9\-_+=/]{32,}$/.test(entry.trim())),
      'Each entry must meet the same requirements as APP_SECRET',
    ),
  // Connection URL of the database
  DATABASE_URL: z.string().min(1),
  // Default sender email address for transactional emails
  EMAIL_DEFAULT_FROM: z.string().default('noreply@example.com'),
  // Enable embedded workers (run queue workers in the API process)
  ENABLE_EMBEDDED_WORKERS: z.stringbool().optional(),
  // Postmark API server token for sending emails
  POSTMARK_SERVER_TOKEN: z.string().min(1),
  // Redis key prefix for namespace isolation (optional)
  REDIS_KEY_PREFIX: z.string().default(''),
  // Connection URL of Redis
  REDIS_URL: z.string().min(1),
  // Sentry DSN
  SENTRY_DSN: z.string().optional(),
  // Hostname to bind the server to
  SERVER_HOST: z.string().default('localhost'),
  // Port to bind the server to
  SERVER_PORT: z.coerce.number().min(1).max(65_535).default(5001),
  // Public origin of the admin web app (e.g. https://app.example.com)
  WEB_URL_ADMIN: originUrl,
  // Public origin of the app web app (e.g. https://app.example.com)
  WEB_URL_APP: originUrl,
}); /* TPL_CONFIG_SCHEMA:END */

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
