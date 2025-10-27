import { z } from 'zod';

/**
 * Infrastructure settings schema
 *
 * Configures optional infrastructure services for the project.
 * These services are shared across all backend applications in the monorepo.
 *
 * Note: PostgreSQL is always enabled for backend apps and doesn't require configuration.
 * Port is calculated as portOffset + 432 (e.g., 3000 → 3432).
 * Password defaults to "{projectName}-password" and database defaults to project name.
 */
export const infrastructureSettingsSchema = z.object({
  /**
   * Redis configuration (optional)
   *
   * Redis can be used for caching, sessions, and queue management.
   * Port is calculated as portOffset + 379 (e.g., 3000 → 3379).
   * Password defaults to "{projectName}-password".
   */
  redis: z
    .object({
      /**
       * Whether to enable Redis service
       */
      enabled: z.boolean().default(false),
    })
    .optional(),
});

/**
 * Input type for infrastructure settings (before Zod transformation)
 */
export type InfrastructureSettingsInput = z.input<
  typeof infrastructureSettingsSchema
>;

/**
 * Output type for infrastructure settings (after Zod transformation and defaults applied)
 */
export type InfrastructureSettingsDefinition = z.output<
  typeof infrastructureSettingsSchema
>;
