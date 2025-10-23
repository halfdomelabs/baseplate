import { z } from 'zod';

const configSchema = /* TPL_CONFIG_SCHEMA:START */ z.object({
  // Environment the app is running in
  APP_ENVIRONMENT: z.enum(['dev', 'test', 'stage', 'prod']),
  // Secret key for signing auth cookie (at least 20 alphanumeric characters)
  AUTH_SECRET: z.string().regex(/^[a-zA-Z0-9-_+=/]{20,}$/),
  // Connection URL of the database
  DATABASE_URL: z.string().min(1),
  // Sentry DSN
  SENTRY_DSN: z.string().optional(),
  // Hostname to bind the server to
  SERVER_HOST: z.string().default('localhost'),
  // Port to bind the server to
  SERVER_PORT: z.coerce.number().min(1).max(65_535).default(3001),
}); /* TPL_CONFIG_SCHEMA:END */

export const config = configSchema.parse(process.env);
