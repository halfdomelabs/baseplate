import { CASE_VALIDATORS } from '@baseplate-dev/utils';
import { z } from 'zod';

/**
 * Kind of template that defaults to `singleton-file`
 */
const templateKindSchema = z
  .enum(['singleton-file', 'instance-file'])
  .default('singleton-file');

/**
 * Schema for a single template configuration
 */
const templateConfigSchema = z
  .object({
    /**
     * Name of the template
     */
    name: CASE_VALIDATORS.KEBAB_CASE,
    /**
     * Type of the template. For example, it can be `ts` for typescript templates.
     */
    type: z.string(),
    /**
     * Path of the template
     */
    path: z.string().optional(),
    /**
     * The kind of template it is:
     * - `singleton-file`: Only one copy of the template is generated per package
     * - `instance-file`: Multiple copies of the template are generated per package
     */
    kind: templateKindSchema,
  })
  .passthrough();

/**
 * Base schema for extractors configuration
 */
const extractorsConfigSchema = z.record(z.string(), z.object({}).passthrough());

/**
 * Main schema for extractor.json configuration
 */
export const extractorConfigSchema = z.object({
  /**
   * Name of the generator, e.g. auth/auth-module
   */
  name: CASE_VALIDATORS.KEBAB_CASE,
  /**
   * Root path of the templates relative to the package, e.g. `@/src` or `{package-root}`
   */
  root: z.string().optional(),
  /**
   * Template map keyed by the file location in the templates/ folder
   */
  templates: z.record(templateConfigSchema),
  /**
   * Configuration for each extractor keyed by extractor type
   */
  extractors: extractorsConfigSchema.optional(),
});

/**
 * Type for extractor configuration
 */
export type ExtractorConfig = z.infer<typeof extractorConfigSchema>;

/**
 * Type for a single template configuration
 */
export type TemplateConfig = z.infer<typeof templateConfigSchema>;

/**
 * Type for extractors configuration
 */
export type ExtractorsConfig = z.infer<typeof extractorsConfigSchema>;

/**
 * Template kind enum
 */
export type TemplateKind = z.infer<typeof templateKindSchema>;
