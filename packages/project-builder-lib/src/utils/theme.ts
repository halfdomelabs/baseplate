import { dasherize, underscore } from 'inflection';

import type {
  DefaultColor,
  ThemeColorKey,
} from '#src/constants/theme-colors.js';
import type {
  PalettesConfig,
  ThemeColorsConfig,
  ThemeConfig,
} from '#src/schema/settings/theme.js';

import { COLOR_PALETTES } from '#src/constants/colors.js';
import { THEME_COLORS } from '#src/constants/theme-colors.js';
import { convertColorNameToOklch } from '#src/utils/color-names.js';

function getDefaultOklch(
  palettes: PalettesConfig,
  color: DefaultColor,
): string | undefined {
  if ('color' in color) {
    return convertColorNameToOklch(color.color);
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
  return getDefaultOklch(palettes, defaultColorConfig);
}

export function generateThemeColorsFromShade(
  palettes: PalettesConfig,
  mode: 'light' | 'dark',
  previousValues?: {
    palettes: PalettesConfig;
    config: ThemeColorsConfig;
  },
): ThemeColorsConfig {
  const result: ThemeColorsConfig = {};

  for (const [key, config] of Object.entries(THEME_COLORS)) {
    const themeColorKey = key as ThemeColorKey;
    const defaultColorConfig =
      mode === 'light' ? config.lightDefault : config.darkDefault;
    const newDefaultColor = getDefaultOklch(palettes, defaultColorConfig);
    const previousDefaultColor =
      previousValues?.config[themeColorKey] &&
      getDefaultOklch(previousValues.palettes, defaultColorConfig);
    const previousValue = previousValues?.config[themeColorKey];

    result[themeColorKey] =
      !newDefaultColor ||
      (previousValue && previousDefaultColor !== previousValue)
        ? previousValue
        : newDefaultColor;
  }

  return result;
}

export function generateCssFromThemeConfig(
  config: ThemeColorsConfig,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(config).map(([key, value]) => [
      `--${dasherize(underscore(key))}`,
      value,
    ]),
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
