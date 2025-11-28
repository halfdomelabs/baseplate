import { z } from 'zod';

/**
 * Schema for a single template configuration in the extractor.json file
 */
export const templateConfigSchema = z.looseObject({
  /**
   * Source file path relative to templates directory
   */
  sourceFile: z.string(),
  /**
   * Type of the template. For example, it can be `ts` for typescript templates.
   */
  type: z.string(),
});

/**
 * Main schema for extractor.json configuration
 */
export const extractorConfigSchema = z.object({
  /**
   * Name of the generator, e.g. auth/auth-module
   */
  name: z
    .string()
    .regex(
      /^[a-z0-9-/]+$/,
      'must be a valid generator basename e.g. core/fastify-scripts',
    ),
  /**
   * Template map keyed by template name
   */
  templates: z.record(z.string(), templateConfigSchema).prefault({}),
  /**
   * Configuration for each extractor keyed by extractor type
   */
  extractors: z.record(z.string(), z.looseObject({})).optional(),
  /**
   * Plugin-specific configuration keyed by plugin name
   */
  plugins: z.record(z.string(), z.looseObject({})).optional(),
});

/**
 * Type for a single template configuration
 */
export type TemplateConfig = z.infer<typeof templateConfigSchema>;

/**
 * Type for extractor configuration
 */
export type ExtractorConfig = z.infer<typeof extractorConfigSchema>;
