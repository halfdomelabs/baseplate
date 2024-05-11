import { converter } from 'culori';
import { dasherize, underscore } from 'inflection';
import { z } from 'zod';

import {
  COLOR_PALETTES,
  PALETTE_SHADES,
  PaletteShade,
} from '@src/constants/colors.js';
import { convertColorNameToHex } from '@src/utils/colors.js';

export const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i);

type DefaultColor =
  | { baseShade: PaletteShade }
  | { primaryShade: PaletteShade }
  | { color: string };

type ThemeColorCategory = 'surface' | 'interactive' | 'utility';

/**
 * Configuration for a theme color.
 */
export interface ThemeColorConfig {
  /** The name of the color. */
  name: string;
  /** A description of the color. */
  description: string;
  /** The default light color. */
  lightDefault: DefaultColor;
  /** The default dark color. */
  darkDefault: DefaultColor;
  /**
   * Used to group colors in the theme editor.
   * Optional.
   */
  groupKey?: string;
  /** Category of the color */
  category: ThemeColorCategory;
}

export const THEME_COLORS = {
  // Surface Colors
  background: {
    name: 'Background',
    description: 'The background color of the page',
    lightDefault: { color: 'white' },
    darkDefault: { baseShade: '950' },
    groupKey: 'page',
    category: 'surface',
  },
  foreground: {
    name: 'Foreground',
    description: 'The foreground color of the page',
    lightDefault: { baseShade: '950' },
    darkDefault: { baseShade: '50' },
    groupKey: 'page',
    category: 'surface',
  },
  muted: {
    name: 'Muted Background',
    description:
      'Muted backgrounds such as <TabsList />, <Skeleton /> and <Switch />, also used as background for containers on white background or vice versa',
    lightDefault: { baseShade: '100' },
    darkDefault: { baseShade: '900' },
    groupKey: 'muted',
    category: 'surface',
  },
  mutedForeground: {
    name: 'Muted Foreground',
    description: 'Used for secondary text and subtitles',
    lightDefault: { baseShade: '500' },
    darkDefault: { baseShade: '400' },
    groupKey: 'muted',
    category: 'surface',
  },
  card: {
    name: 'Card Background',
    description: 'Background color for <Card />',
    lightDefault: { color: 'white' },
    darkDefault: { baseShade: '950' },
    groupKey: 'card',
    category: 'surface',
  },
  cardForeground: {
    name: 'Card Foreground',
    description: 'Foreground color for <Card />',
    lightDefault: { baseShade: '950' },
    darkDefault: { baseShade: '50' },
    groupKey: 'card',
    category: 'surface',
  },
  popover: {
    name: 'Popover Background',
    description:
      'Background color for popovers such as <DropdownMenu />, <HoverCard />, <Popover />',
    lightDefault: { color: 'white' },
    darkDefault: { baseShade: '950' },
    groupKey: 'popover',
    category: 'surface',
  },
  popoverForeground: {
    name: 'Popover Foreground',
    description:
      'Foreground color for popovers such as <DropdownMenu />, <HoverCard />, <Popover />',
    lightDefault: { baseShade: '950' },
    darkDefault: { baseShade: '50' },
    groupKey: 'popover',
    category: 'surface',
  },
  accent: {
    name: 'Accent',
    description:
      'Used for accents such as hover effects on <DropdownMenuItem>, <SelectItem>...',
    lightDefault: { primaryShade: '100' },
    darkDefault: { primaryShade: '800' },
    groupKey: 'accent',
    category: 'surface',
  },
  accentForeground: {
    name: 'Accent Foreground',
    description:
      'Used for accent foregrounds such as hover effects on <DropdownMenuItem>, <SelectItem>...',
    lightDefault: { baseShade: '700' },
    darkDefault: { baseShade: '100' },
    groupKey: 'accent',
    category: 'surface',
  },
  success: {
    name: 'Success',
    description: 'Used for success state on input fields, toast or alerts',
    lightDefault: { color: 'emerald-600' },
    darkDefault: { baseShade: '50' },
    groupKey: 'success',
    category: 'surface',
  },
  successForeground: {
    name: 'Success Foreground',
    description: 'Used for success foregrounds',
    lightDefault: { primaryShade: '50' },
    darkDefault: { primaryShade: '50' },
    groupKey: 'success',
    category: 'surface',
  },
  warning: {
    name: 'Warning',
    description: 'Used for warning color on toast or alert',
    lightDefault: { color: 'amber-600' },
    darkDefault: { color: 'amber-700' },
    groupKey: 'warning',
    category: 'surface',
  },
  warningForeground: {
    name: 'Warning Foreground',
    description: 'Used for warning foregrounds',
    lightDefault: { primaryShade: '50' },
    darkDefault: { primaryShade: '50' },
    groupKey: 'warning',
    category: 'surface',
  },
  error: {
    name: 'Error',
    description: 'Used for error state on input fields, toast or alerts',
    lightDefault: { color: 'red-600' },
    darkDefault: { color: 'red-700' },
    groupKey: 'error',
    category: 'surface',
  },
  errorForeground: {
    name: 'Error Foreground',
    description: 'Used for error foregrounds',
    lightDefault: { primaryShade: '50' },
    darkDefault: { primaryShade: '50' },
    groupKey: 'error',
    category: 'surface',
  },
  // Interactive Element Colors
  primary: {
    name: 'Primary',
    description:
      'Primary colors for <Button /> and other active states for interactive elements such as checkbox',
    lightDefault: { primaryShade: '700' },
    darkDefault: { primaryShade: '600' },
    groupKey: 'primary',
    category: 'interactive',
  },
  primaryHover: {
    name: 'Primary Hover',
    description: 'Hover background for primary color',
    lightDefault: { primaryShade: '900' },
    darkDefault: { primaryShade: '800' },
    groupKey: 'primary',
    category: 'interactive',
  },
  primaryForeground: {
    name: 'Primary Foreground',
    description: 'Text color for primary button',
    lightDefault: { baseShade: '50' },
    darkDefault: { baseShade: '50' },
    groupKey: 'primary',
    category: 'interactive',
  },
  secondary: {
    name: 'Secondary',
    description: 'Secondary colors for <Button />',
    lightDefault: { primaryShade: '100' },
    darkDefault: { primaryShade: '800' },
    groupKey: 'secondary',
    category: 'interactive',
  },
  secondaryHover: {
    name: 'Secondary Hover',
    description: 'Hover background for secondary color',
    lightDefault: { primaryShade: '300' },
    darkDefault: { primaryShade: '600' },
    groupKey: 'secondary',
    category: 'interactive',
  },
  secondaryForeground: {
    name: 'Secondary Foreground',
    description: 'Text color for secondary button',
    lightDefault: { baseShade: '700' },
    darkDefault: { baseShade: '100' },
    groupKey: 'secondary',
    category: 'interactive',
  },
  destructive: {
    name: 'Destructive',
    description:
      'Used for destructive actions such as <Button variant="destructive">',
    lightDefault: { color: 'red-500' },
    darkDefault: { color: 'red-900' },
    groupKey: 'destructive',
    category: 'interactive',
  },
  destructiveHover: {
    name: 'Destructive Hover',
    description: 'Hover color for destructive background',
    lightDefault: { color: 'red-700' },
    darkDefault: { color: 'red-700' },
    groupKey: 'destructive',
    category: 'interactive',
  },
  destructiveForeground: {
    name: 'Destructive Foreground',
    description: 'Hover color for destructive background',
    lightDefault: { baseShade: '50' },
    darkDefault: { baseShade: '50' },
    groupKey: 'destructive',
    category: 'interactive',
  },
  link: {
    name: 'Link',
    description: 'Used for interactive links mostly in text',
    lightDefault: { primaryShade: '700' },
    darkDefault: { primaryShade: '600' },
    groupKey: 'link',
    category: 'interactive',
  },
  linkVisited: {
    name: 'Visited Link',
    description: 'Color for link after being visited',
    lightDefault: { primaryShade: '800' },
    darkDefault: { primaryShade: '700' },
    groupKey: 'link',
    category: 'interactive',
  },
  // Utility Colors
  border: {
    name: 'Border',
    description: 'Default border color',
    lightDefault: { baseShade: '200' },
    darkDefault: { baseShade: '800' },
    groupKey: 'border',
    category: 'utility',
  },
  input: {
    name: 'Input Border',
    description:
      'Border color for inputs such as <Input />, <Select />, <Textarea />',
    lightDefault: { baseShade: '200' },
    darkDefault: { baseShade: '800' },
    groupKey: 'border',
    category: 'utility',
  },
  ring: {
    name: 'Focus Ring',
    description:
      'Used for focus ring. Will be 30% opacity on light and 50% on dark',
    lightDefault: { primaryShade: '700' }, // 30% opacity
    darkDefault: { primaryShade: '600' }, // 50% opacity
    groupKey: 'ring',
    category: 'utility',
  },
} satisfies Record<string, ThemeColorConfig>;

type ThemeColorKey = keyof typeof THEME_COLORS;

export const themeColorKeys = Object.keys(THEME_COLORS) as ThemeColorKey[];

export const themeColorSchema = z.record(
  z.enum(themeColorKeys as [ThemeColorKey, ...ThemeColorKey[]]),
  hexColor,
);

export type ThemeColorsConfig = z.infer<typeof themeColorSchema>;

export type PaletteShades = Record<PaletteShade, string>;

export const paletteSchema = z
  .object({
    paletteName: z.string().min(1),
    customBase: hexColor.nullish(),
    shades: z.record(z.enum(PALETTE_SHADES), hexColor),
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

function getDefaultHex(
  palettes: PalettesConfig,
  color: DefaultColor,
): string | undefined {
  if ('color' in color) {
    return convertColorNameToHex(color.color);
  }
  if ('primaryShade' in color) {
    return palettes.primary.shades[color.primaryShade];
  }
  return palettes.base.shades[color.baseShade];
}

export function getDefaultThemeColorFromShade(
  palettes: PalettesConfig,
  mode: 'light' | 'dark',
  themeColorKey: ThemeColorKey,
): string | undefined {
  const defaultColorConfig =
    THEME_COLORS[themeColorKey][
      mode === 'light' ? 'lightDefault' : 'darkDefault'
    ];
  return getDefaultHex(palettes, defaultColorConfig);
}

export function generateThemeColorsFromShade(
  palettes: PalettesConfig,
  mode: 'light' | 'dark',
  previousValues?: {
    palettes: PalettesConfig;
    config: ThemeColorsConfig;
  },
): ThemeColorsConfig {
  return Object.entries(THEME_COLORS).reduce<ThemeColorsConfig>(
    (acc, [key, config]) => {
      const themeColorKey = key as ThemeColorKey;
      const defaultColorConfig =
        mode === 'light' ? config.lightDefault : config.darkDefault;
      const newDefaultColor = getDefaultHex(palettes, defaultColorConfig);
      const previousDefaultColor =
        previousValues?.config[themeColorKey] &&
        getDefaultHex(previousValues.palettes, defaultColorConfig);
      const previousValue = previousValues?.config[themeColorKey];

      // if previous default doesn't match previous value, don't overwrite it
      if (
        !newDefaultColor ||
        (previousValue && previousDefaultColor !== previousValue)
      ) {
        acc[themeColorKey] = previousValue;
      } else {
        acc[themeColorKey] = newDefaultColor;
      }
      return acc;
    },
    {},
  );
}

function convertHexToHsl(hex: string): string {
  const convert = converter('hsl');
  const hsl = convert(hex) ?? { h: 0, s: 0, l: 0 };
  return `${Math.round(hsl.h ?? 0)} ${Math.round(hsl.s * 100)}% ${Math.round(
    hsl.l * 100,
  )}%`;
}

export function generateCssFromThemeConfig(
  config: ThemeColorsConfig,
): Record<string, string> {
  return Object.entries(config).reduce<Record<string, string>>(
    (acc, [key, value]) => ({
      ...acc,
      [`--${dasherize(underscore(key))}`]: convertHexToHsl(value),
    }),
    {},
  );
}

export function generateDefaultTheme(): ThemeConfig {
  const slatePalette = {
    paletteName: 'slate',
    shades: COLOR_PALETTES.slate,
  };
  const slatePalettes = {
    base: slatePalette,
    primary: slatePalette,
  };

  return {
    palettes: slatePalettes,
    colors: {
      light: generateThemeColorsFromShade(slatePalettes, 'light'),
      dark: generateThemeColorsFromShade(slatePalettes, 'dark'),
    },
  };
}
