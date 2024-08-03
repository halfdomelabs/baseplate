import { z } from 'zod';

const configSchema = z.object({
  // Environment the app is running in
  APP_ENVIRONMENT: z.enum(['development', 'test', 'staging', 'production']),
  // Connection URL of the database
  DATABASE_URL: z.string().min(1),
  // Sentry DSN
  SENTRY_DSN: z.string().optional(),
  // Hostname to bind the server to
  SERVER_HOST: z.string().default('localhost'),
  // Port to bind the server to
  SERVER_PORT: z.coerce.number().min(1).max(65535).default(3001),
});

export const config = configSchema.parse(process.env);
