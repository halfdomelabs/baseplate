import { z } from 'zod';

import type { PaletteShade } from '@src/constants/colors.js';
import type { ThemeColorKey } from '@src/constants/theme-colors.js';

import { PALETTE_SHADES } from '@src/constants/colors.js';
import { THEME_COLOR_KEYS } from '@src/constants/theme-colors.js';

export const oklchColor = z
  .string()
  .regex(
    /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/,
    {
      message:
        'OKLCH color must be of the format "oklch(l c h [/ a])" where l and c are between 0 and 1 and h is between 0 and 360 and a is between 0 and 100',
    },
  );

export const themeColorSchema = z.record(
  z.enum(THEME_COLOR_KEYS as [ThemeColorKey, ...ThemeColorKey[]]),
  oklchColor,
);

export type ThemeColorsConfig = z.infer<typeof themeColorSchema>;

export type PaletteShades = Record<PaletteShade, string>;

export const paletteSchema = z
  .object({
    paletteName: z.string().min(1),
    customBase: oklchColor.nullish(),
    shades: z.record(z.enum(PALETTE_SHADES), oklchColor),
  })
  .refine((data) => data.paletteName !== 'custom' || !!data.paletteName, {
    message: 'A custom base color is required if using a custom base palette',
    path: ['customBase'],
  });

export const palettesSchema = z.object({
  base: paletteSchema,
  primary: paletteSchema,
});

export type PalettesConfig = z.infer<typeof palettesSchema>;

export const themeSchema = z.object({
  palettes: z.object({
    base: paletteSchema,
    primary: paletteSchema,
  }),
  colors: z.object({
    light: themeColorSchema,
    dark: themeColorSchema,
  }),
});

export type ThemeConfig = z.infer<typeof themeSchema>;
