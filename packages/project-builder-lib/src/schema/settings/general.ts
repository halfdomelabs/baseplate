import { CASE_VALIDATORS } from '@baseplate-dev/utils';
import { z } from 'zod';

/**
 * General project settings schema
 *
 * Includes basic project configuration like name, package scope, and port offset.
 */
export const generalSettingsSchema = z.object({
  /**
   * The name of the project.
   *
   * Must be in kebab-case format (lowercase letters and dashes only).
   * Example: "my-awesome-project"
   */
  name: CASE_VALIDATORS.KEBAB_CASE,

  /**
   * The package scope of the project if any.
   *
   * Used for scoped npm packages, e.g. "my-org" results in "@my-org/package-name".
   * Must be in kebab-case format or empty string.
   * Example: "my-org" → "@my-org/backend", "@my-org/web"
   */
  packageScope: z
    .string()
    .regex(/^([a-z0-9-]+)?$/, {
      message: 'Must be kebab case (e.g. "my-org") or empty',
    })
    .default(''),

  /**
   * The port offset to base the app ports on for development.
   *
   * Must be a multiple of 1000 between 1000 and 60000.
   * Each app will use offset + specific port number (e.g. offset 8000 → DB at 8432, API at 8001).
   * This allows running multiple Baseplate projects without port conflicts.
   *
   * Example: 3000 → backend API at 3001, database at 3432, Redis at 3379
   */
  portOffset: z
    .number()
    .min(1000)
    .max(60_000)
    .int()
    .refine(
      (portOffset) => portOffset % 1000 === 0,
      'Port offset must be a multiple of 1000, e.g. 1000, 2000, 3000, etc.',
    ),
});

/**
 * Input type for general settings (before Zod transformation)
 */
export type GeneralSettingsInput = z.input<typeof generalSettingsSchema>;

/**
 * Output type for general settings (after Zod transformation and defaults applied)
 */
export type GeneralSettingsDefinition = z.output<typeof generalSettingsSchema>;
