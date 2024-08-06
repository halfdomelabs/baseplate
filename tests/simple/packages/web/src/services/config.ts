import { z } from 'zod';

const configSchema = z.object({
  // Environment the app is running in
  VITE_ENVIRONMENT: z.enum(['development', 'test', 'staging', 'production']),
  // URL for the GraphQL API endpoint
  VITE_GRAPH_API_ENDPOINT: z.string().min(1),
  // DSN for Sentry (optional)
  VITE_SENTRY_DSN: z.string().optional(),
});

export const config = configSchema.parse(import.meta.env);
