import { z } from 'zod';

const configSchema = /* TPL_CONFIG_SCHEMA:START */ z.object({
  // Environment the app is running in
  APP_ENVIRONMENT: z.enum(['dev', 'test', 'stage', 'prod']),
  // Auth0 audience
  AUTH0_AUDIENCE: z.string().min(1),
  // Auth0 management client ID (https://auth0.com/docs/get-started/auth0-overview/create-applications/machine-to-machine-apps)
  AUTH0_CLIENT_ID: z.string().min(1),
  // Auth0 management client secret
  AUTH0_CLIENT_SECRET: z.string().min(1),
  // Auth0 domain (can be custom domain)
  AUTH0_DOMAIN: z.string().min(1),
  // Auth0 tenant domain (ends with auth0.com), e.g. domain.auth0.com
  AUTH0_TENANT_DOMAIN: z.string().min(1),
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
