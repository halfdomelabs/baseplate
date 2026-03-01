import { z } from 'zod';

const configSchema = /* TPL_CONFIG_SCHEMA:START */ z.object({
  // Environment the app is running in
  APP_ENVIRONMENT: z.enum(['dev', 'test', 'stage', 'prod']),
  // Comma-separated list of allowed origins for CORS/CSRF
  ALLOWED_ORIGINS: z.string().default(''),
  // Secret key for Better Auth (min 32 characters)
  BETTER_AUTH_SECRET: z.string().min(32),
  // Base URL for Better Auth (e.g. http://localhost:6001)
  BETTER_AUTH_URL: z.url(),
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
  // Connection URL of the database
  DATABASE_URL: z.string().min(1),
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

export const config = configSchema.parse(process.env);
