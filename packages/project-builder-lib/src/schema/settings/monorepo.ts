import { CASE_VALIDATORS } from '@baseplate-dev/utils';
import { z } from 'zod';

/**
 * Monorepo settings schema
 *
 * Configures the folder structure for monorepo packages.
 * In V1, only supports configuring the apps folder location.
 */
export const monorepoSettingsSchema = z.object({
  /**
   * The folder where apps are located in the monorepo.
   *
   * Must be in kebab-case format (lowercase letters and dashes only).
   * Apps will be placed in {appsFolder}/{app-name}, e.g. "apps/backend", "apps/web".
   *
   * @default "apps"
   * @example "apps" → apps/backend, apps/web
   * @example "applications" → applications/backend, applications/web
   */
  appsFolder: CASE_VALIDATORS.KEBAB_CASE.min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, {
      message:
        'Apps folder must contain only lowercase letters, numbers, and dashes (no slashes)',
    })
    .default('apps'),
});

/**
 * Input type for monorepo settings (before Zod transformation)
 */
export type MonorepoSettingsInput = z.input<typeof monorepoSettingsSchema>;

/**
 * Output type for monorepo settings (after Zod transformation and defaults applied)
 */
export type MonorepoSettingsDefinition = z.output<
  typeof monorepoSettingsSchema
>;
