import { CASE_VALIDATORS } from '@halfdomelabs/utils';
import { z } from 'zod';

import { definitionSchema } from './creator/schema-creator.js';
import { themeSchema } from './features/index.js';
import { templateExtractorSchema } from './template-extractor/index.js';

export const generalSettingsSchema = z.object({
  /**
   * The name of the project.
   */
  name: CASE_VALIDATORS.KEBAB_CASE,
  /**
   * The package scope of the project if any e.g. halfdomelabs for @halfdomelabs/package-name.
   */
  packageScope: z
    .union([z.literal(''), CASE_VALIDATORS.KEBAB_CASE])
    .default(''),
  /**
   * The port offset to base the app ports on for development (e.g. 8000 => 8432 for DB).
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

export type GeneralSettingsInput = z.input<typeof generalSettingsSchema>;

export type GeneralSettingsDefinition = z.output<typeof generalSettingsSchema>;

export const createSettingsSchema = definitionSchema(() =>
  z.object({
    general: generalSettingsSchema,
    templateExtractor: templateExtractorSchema.optional(),
    theme: themeSchema.optional(),
  }),
);
