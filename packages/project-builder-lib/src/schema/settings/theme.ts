import { z } from 'zod';

import type { PaletteShade } from '#src/constants/colors.js';
import type { ThemeColorKey } from '#src/constants/theme-colors.js';
import type { def } from '#src/schema/creator/index.js';

import { PALETTE_SHADES } from '#src/constants/colors.js';
import { THEME_COLOR_KEYS } from '#src/constants/theme-colors.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';

/**
 * OKLCH color format validator
 *
 * OKLCH is a perceptually uniform color space that provides better color manipulation than RGB/HEX.
 * Format: oklch(l c h [/ a]) where:
 * - l (lightness): 0-1
 * - c (chroma): 0-1
 * - h (hue): 0-360
 * - a (alpha, optional): 0-100
 *
 * Example: "oklch(0.5 0.2 180)" or "oklch(0.5 0.2 180 / 50)"
 */
export const oklchColor = z
  .string()
  .regex(
    /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/,
    {
      message:
        'OKLCH color must be of the format "oklch(l c h [/ a])" where l and c are between 0 and 1 and h is between 0 and 360 and a is between 0 and 100',
    },
  );

/**
 * Theme color configuration
 *
 * Maps semantic color keys (e.g. "background", "foreground", "primary") to OKLCH color values.
 */
export const themeColorSchema = z.record(
  z.enum(THEME_COLOR_KEYS as [ThemeColorKey, ...ThemeColorKey[]]),
  oklchColor.optional(),
);

/**
 * Theme colors configuration type
 */
export type ThemeColorsConfig = z.infer<typeof themeColorSchema>;

/**
 * Palette shades type - maps shade names to OKLCH colors
 */
export type PaletteShades = Record<PaletteShade, string>;

/**
 * Palette configuration schema
 *
 * Defines a color palette with a base color and generated shades.
 * Palettes can use predefined bases (zinc, slate, etc.) or a custom base color.
 */
export const paletteSchema = z
  .object({
    /**
     * Name of the palette base (e.g. "zinc", "slate") or "custom" for custom base color
     */
    paletteName: z.string().min(1),

    /**
     * Custom base color in OKLCH format.
     * Required when paletteName is "custom", ignored otherwise.
     */
    customBase: oklchColor.nullish(),

    /**
     * Generated color shades (50, 100, 200, ..., 950)
     * Automatically computed from the base color
     */
    shades: z.record(z.enum(PALETTE_SHADES), oklchColor),
  })
  .refine((data) => data.paletteName !== 'custom' || !!data.customBase, {
    message: 'A custom base color is required if using a custom base palette',
    path: ['customBase'],
  });

/**
 * Palettes configuration schema
 *
 * Defines base (neutral colors) and primary (brand colors) palettes
 */
export const palettesSchema = z.object({
  /**
   * Base palette used for neutral colors (backgrounds, borders, text)
   */
  base: paletteSchema,

  /**
   * Primary palette used for brand colors (buttons, links, highlights)
   */
  primary: paletteSchema,
});

/**
 * Palettes configuration type
 */
export type PalettesConfig = z.infer<typeof palettesSchema>;

/**
 * Theme configuration schema
 *
 * Defines the complete theme including palettes and semantic color mappings for light and dark modes.
 */
export const createThemeSchema = definitionSchema(() =>
  z.object({
    /**
     * Color palettes for base and primary colors
     */
    palettes: z.object({
      base: paletteSchema,
      primary: paletteSchema,
    }),

    /**
     * Semantic color mappings for light and dark modes
     */
    colors: z.object({
      /**
       * Light mode color mappings
       */
      light: themeColorSchema,

      /**
       * Dark mode color mappings
       */
      dark: themeColorSchema,
    }),
  }),
);

/**
 * Theme configuration type (output after validation)
 */
export type ThemeConfig = def.InferOutput<typeof createThemeSchema>;
