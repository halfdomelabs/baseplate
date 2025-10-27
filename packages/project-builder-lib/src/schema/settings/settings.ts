import { z } from 'zod';

import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { generalSettingsSchema } from './general.js';
import { infrastructureSettingsSchema } from './infrastructure.js';
import { monorepoSettingsSchema } from './monorepo.js';
import { createTemplateExtractorSchema } from './template-extractor.js';
import { createThemeSchema } from './theme.js';

/**
 * Complete project settings schema
 *
 * Combines all settings categories:
 * - general: Project name, scope, and port configuration
 * - infrastructure: Infrastructure services (Postgres, Redis)
 * - monorepo: Monorepo folder configuration (optional)
 * - templateExtractor: Template extraction configuration (optional)
 * - theme: UI theme and color palette configuration (optional)
 */
export const createSettingsSchema = definitionSchema((ctx) =>
  z.object({
    /**
     * General project settings (required)
     */
    general: generalSettingsSchema,

    /**
     * Infrastructure settings (optional)
     *
     * Configures infrastructure services like Postgres and Redis.
     * When omitted, uses default configuration (Postgres enabled, Redis disabled).
     */
    infrastructure: infrastructureSettingsSchema.optional(),

    /**
     * Monorepo configuration (optional)
     *
     * Configures the folder structure for monorepo packages.
     * When omitted, uses default folder structure (apps/*).
     */
    monorepo: monorepoSettingsSchema.optional(),

    /**
     * Template extractor configuration (optional)
     *
     * Controls how template extraction works when syncing projects.
     * Only needed when developing generators or extracting templates.
     */
    templateExtractor: createTemplateExtractorSchema(ctx).optional(),

    /**
     * Theme configuration (optional)
     *
     * Defines color palettes and semantic color mappings for the UI.
     * When omitted, uses default theme configuration.
     */
    theme: createThemeSchema(ctx).optional(),
  }),
);
