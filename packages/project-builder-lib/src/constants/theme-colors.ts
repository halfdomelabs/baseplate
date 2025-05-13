import type { PaletteShade } from './colors.js';

export type DefaultColor =
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
  /** Opacity of color (out of 100) */
  opacity?: number;
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
    darkDefault: { baseShade: '800' },
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
    lightDefault: { baseShade: '100' },
    darkDefault: { baseShade: '800' },
    groupKey: 'accent',
    category: 'surface',
  },
  accentForeground: {
    name: 'Accent Foreground',
    description:
      'Used for accent foregrounds such as hover effects on <DropdownMenuItem>, <SelectItem>...',
    lightDefault: { baseShade: '900' },
    darkDefault: { baseShade: '50' },
    groupKey: 'accent',
    category: 'surface',
  },
  success: {
    name: 'Success',
    description: 'Used for success state on input fields, toast or alerts',
    lightDefault: { color: 'emerald-50' },
    darkDefault: { color: 'emerald-950' },
    groupKey: 'success',
    category: 'surface',
  },
  successForeground: {
    name: 'Success Foreground',
    description: 'Used for success foregrounds',
    lightDefault: { color: 'emerald-700' },
    darkDefault: { color: 'emerald-600' },
    groupKey: 'success',
    category: 'surface',
  },
  warning: {
    name: 'Warning',
    description: 'Used for warning color on toast or alert',
    lightDefault: { color: 'amber-50' },
    darkDefault: { color: 'amber-950' },
    groupKey: 'warning',
    category: 'surface',
  },
  warningForeground: {
    name: 'Warning Foreground',
    description: 'Used for warning foregrounds',
    lightDefault: { color: 'amber-600' },
    darkDefault: { color: 'amber-700' },
    groupKey: 'warning',
    category: 'surface',
  },
  error: {
    name: 'Error',
    description: 'Used for error state on input fields, toast or alerts',
    lightDefault: { color: 'red-50' },
    darkDefault: { color: 'red-950' },
    groupKey: 'error',
    category: 'surface',
  },
  errorForeground: {
    name: 'Error Foreground',
    description: 'Used for error foregrounds',
    lightDefault: { color: 'red-700' },
    darkDefault: { color: 'red-600' },
    groupKey: 'error',
    category: 'surface',
  },
  // Interactive Element Colors
  primary: {
    name: 'Primary',
    description:
      'Primary colors for <Button /> and other active states for interactive elements such as checkbox',
    lightDefault: { primaryShade: '900' },
    darkDefault: { primaryShade: '950' },
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
    lightDefault: { baseShade: '100' },
    darkDefault: { baseShade: '800' },
    groupKey: 'secondary',
    category: 'interactive',
  },
  secondaryHover: {
    name: 'Secondary Hover',
    description: 'Hover background for secondary color',
    lightDefault: { baseShade: '300' },
    darkDefault: { baseShade: '600' },
    groupKey: 'secondary',
    category: 'interactive',
  },
  secondaryForeground: {
    name: 'Secondary Foreground',
    description: 'Text color for secondary button',
    lightDefault: { baseShade: '900' },
    darkDefault: { baseShade: '50' },
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
    description: 'Used for focus ring. At 30% opacity.',
    lightDefault: { primaryShade: '950' },
    darkDefault: { primaryShade: '300' },
    opacity: 0.3,
    groupKey: 'ring',
    category: 'utility',
  },
} satisfies Record<string, ThemeColorConfig>;

export type ThemeColorKey = keyof typeof THEME_COLORS;

export const THEME_COLOR_KEYS = Object.keys(THEME_COLORS) as ThemeColorKey[];
