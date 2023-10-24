import { converter } from 'culori';
import { dasherize, underscore } from 'inflection';
import { z } from 'zod';

export const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i);

export const PALETTE_SHADES = [
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  '950',
] as const;

export type PaletteShade = (typeof PALETTE_SHADES)[number];

type DefaultColor =
  | { baseShade: PaletteShade }
  | { primaryShade: PaletteShade }
  | { color: string };

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
  categoryKey?: string;
}

const themeColorKeys = [
  'background',
  'foreground',
  'card',
  'cardForeground',
  'popover',
  'popoverForeground',
  'primary',
  'primaryForeground',
  'secondary',
  'secondaryForeground',
  'muted',
  'mutedForeground',
  'accent',
  'accentForeground',
  'destructive',
  'destructiveForeground',
  'border',
  'inputBorder',
  'accent',
  'ring',
  'link',
  'linkVisited',
] as const;

type ThemeColorKey = (typeof themeColorKeys)[number];

export const THEME_COLORS: Record<ThemeColorKey, ThemeColorConfig> = {
  background: {
    name: 'Background',
    description: 'The background color of the page',
    lightDefault: { color: '#ffffff' },
    darkDefault: { baseShade: '950' },
    categoryKey: 'page',
  },
  foreground: {
    name: 'Foreground',
    description: 'The foreground color of the page',
    lightDefault: { baseShade: '950' },
    darkDefault: { baseShade: '50' },
    categoryKey: 'page',
  },
  muted: {
    name: 'Muted Background',
    description:
      'Muted backgrounds such as <TabsList />, <Skeleton /> and <Switch />',
    lightDefault: { baseShade: '100' },
    darkDefault: { baseShade: '800' },
    categoryKey: 'muted',
  },
  mutedForeground: {
    name: 'Muted Foreground',
    description:
      'Muted foregrounds such as <TabsList />, <Skeleton /> and <Switch />',
    lightDefault: { baseShade: '500' },
    darkDefault: { baseShade: '400' },
    categoryKey: 'muted',
  },
  card: {
    name: 'Card Background',
    description: 'Background color for <Card />',
    lightDefault: { color: '#ffffff' },
    darkDefault: { baseShade: '950' },
    categoryKey: 'card',
  },
  cardForeground: {
    name: 'Card Foreground',
    description: 'Foreground color for <Card />',
    lightDefault: { baseShade: '950' },
    darkDefault: { baseShade: '50' },
    categoryKey: 'card',
  },
  popover: {
    name: 'Popover Background',
    description:
      'Background color for popovers such as <DropdownMenu />, <HoverCard />, <Popover />',
    lightDefault: { color: '#ffffff' },
    darkDefault: { baseShade: '950' },
    categoryKey: 'popover',
  },
  popoverForeground: {
    name: 'Popover Foreground',
    description:
      'Foreground color for popovers such as <DropdownMenu />, <HoverCard />, <Popover />',
    lightDefault: { baseShade: '950' },
    darkDefault: { baseShade: '50' },
    categoryKey: 'popover',
  },
  border: {
    name: 'Border',
    description: 'Default border color',
    lightDefault: { baseShade: '200' },
    darkDefault: { baseShade: '800' },
    categoryKey: 'border',
  },
  inputBorder: {
    name: 'Input Border',
    description:
      'Border color for inputs such as <Input />, <Select />, <Textarea />',
    lightDefault: { baseShade: '200' },
    darkDefault: { baseShade: '800' },
    categoryKey: 'border',
  },
  primary: {
    name: 'Primary',
    description: 'Primary colors for <Button />',
    lightDefault: { primaryShade: '800' },
    darkDefault: { primaryShade: '50' },
    categoryKey: 'primary',
  },
  primaryForeground: {
    name: 'Primary Foreground',
    description: 'Primary foreground colors for <Button />',
    lightDefault: { baseShade: '50' },
    darkDefault: { baseShade: '900' },
    categoryKey: 'primary',
  },
  secondary: {
    name: 'Secondary',
    description: 'Secondary colors for <Button />',
    lightDefault: { baseShade: '100' },
    darkDefault: { baseShade: '800' },
    categoryKey: 'secondary',
  },
  secondaryForeground: {
    name: 'Secondary Foreground',
    description: 'Secondary foreground colors for <Button />',
    lightDefault: { baseShade: '900' },
    darkDefault: { baseShade: '50' },
    categoryKey: 'secondary',
  },
  accent: {
    name: 'Accent',
    description:
      'Used for accents such as hover effects on <DropdownMenuItem>, <SelectItem>...etc',
    lightDefault: { primaryShade: '100' },
    darkDefault: { primaryShade: '800' },
    categoryKey: 'accent',
  },
  accentForeground: {
    name: 'Accent Foreground',
    description:
      'Used for accent foregrounds such as hover effects on <DropdownMenuItem>, <SelectItem>...etc',
    lightDefault: { baseShade: '900' },
    darkDefault: { baseShade: '50' },
    categoryKey: 'accent',
  },
  destructive: {
    name: 'Destructive',
    description:
      'Used for destructive actions such as <Button variant="destructive">',
    lightDefault: { color: '#ef4444' },
    darkDefault: { color: '#7f1d1d' },
    categoryKey: 'destructive',
  },
  destructiveForeground: {
    name: 'Destructive Foreground',
    description:
      'Used for destructive actions such as <Button variant="destructive">',
    lightDefault: { primaryShade: '50' },
    darkDefault: { primaryShade: '50' },
    categoryKey: 'destructive',
  },
  ring: {
    name: 'Focus Ring',
    description: 'Used for focus ring',
    lightDefault: { primaryShade: '950' },
    darkDefault: { primaryShade: '300' },
    categoryKey: 'ring',
  },
  link: {
    name: 'Link',
    description: 'Used for links',
    lightDefault: { primaryShade: '800' },
    darkDefault: { primaryShade: '50' },
    categoryKey: 'link',
  },
  linkVisited: {
    name: 'Visited Link',
    description: 'Used for visited links',
    lightDefault: { primaryShade: '700' },
    darkDefault: { primaryShade: '100' },
    categoryKey: 'link',
  },
};

export const themeColorSchema = z.record(z.enum(themeColorKeys), hexColor);

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
    return color.color;
  }
  if ('primaryShade' in color) {
    return palettes.primary.shades[color.primaryShade];
  }
  return palettes.base.shades[color.baseShade];
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
    shades: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
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
