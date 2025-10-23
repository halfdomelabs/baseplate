import { z } from 'zod';

const configSchema = z.object(
  /* TPL_CONFIG_SCHEMA:START */ {
    // Auth0 Audience
    VITE_AUTH0_AUDIENCE: z.string().min(1),
    // Auth0 Client ID
    VITE_AUTH0_CLIENT_ID: z.string().min(1),
    // Auth0 Domain
    VITE_AUTH0_DOMAIN: z.string().min(1),
    // Environment the app is running in
    VITE_ENVIRONMENT: z.enum(['dev', 'test', 'stage', 'prod']),
    // URL for the GraphQL API endpoint
    VITE_GRAPH_API_ENDPOINT: z.string().min(1),
    // DSN for Sentry (optional)
    VITE_SENTRY_DSN: z.string().optional(),
  } /* TPL_CONFIG_SCHEMA:END */,
);

export const config = configSchema.parse(import.meta.env);
