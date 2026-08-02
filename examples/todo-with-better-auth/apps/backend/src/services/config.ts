import { z } from 'zod';

const configSchema = /* TPL_CONFIG_SCHEMA:START */ z.object({
  // Comma-separated list of allowed CORS origins (e.g. https://example.com,https://app.example.com)
  ALLOWED_ORIGINS: z.string().default(''),
  // Environment the app is running in
  APP_ENVIRONMENT: z.enum(['dev', 'test', 'stage', 'prod']),
  // Frontend URL for authentication flows including password reset and email verification (e.g., https://app.example.com)
  AUTH_FRONTEND_URL: z.url(),
  // AWS access key ID
  AWS_ACCESS_KEY_ID: z.string().min(1),
  // AWS default region
  AWS_DEFAULT_REGION: z.string().min(1),
  // AWS secret access key
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  // S3 bucket for uploads
  AWS_UPLOADS_BUCKET: z.string().min(1),
  // Hosted URL prefix for uploads, e.g. https://uploads.example.com
  AWS_UPLOADS_URL: z.string().min(1),
  // Better Auth secret key for signing sessions
  BETTER_AUTH_SECRET: z.string().min(32),
  // Better Auth base URL (backend server URL)
  BETTER_AUTH_URL: z.url(),
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
  SERVER_PORT: z.coerce.number().min(1).max(65_535).default(6001),
  // Stripe webhook endpoint secret
  STRIPE_ENDPOINT_SECRET: z.string().min(1),
  // Stripe secret API key
  STRIPE_SECRET_KEY: z.string().min(1),
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
