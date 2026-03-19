import { omit } from 'es-toolkit';

import { createSchemaMigration } from './types.js';

const REMOVED_THEME_COLOR_KEYS = [
  'primaryHover',
  'secondaryHover',
  'destructiveHover',
  'linkVisited',
] as const;

type ThemeColors = Record<string, unknown>;

interface OldConfig {
  settings?: {
    theme?: {
      colors?: {
        light?: ThemeColors;
        dark?: ThemeColors;
      };
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function stripRemovedKeys(colors: ThemeColors): ThemeColors {
  return omit(colors, REMOVED_THEME_COLOR_KEYS);
}

export const migration030RemoveThemeHoverColors = createSchemaMigration<
  OldConfig,
  OldConfig
>({
  version: 30,
  name: 'removeThemeHoverColors',
  description:
    'Remove primaryHover, secondaryHover, destructiveHover, and linkVisited from theme colors (now computed via color-mix)',
  migrate: (config) => {
    const theme = config.settings?.theme;
    if (!theme?.colors) {
      return config;
    }

    return {
      ...config,
      settings: {
        ...config.settings,
        theme: {
          ...theme,
          colors: {
            ...theme.colors,
            ...(theme.colors.light
              ? { light: stripRemovedKeys(theme.colors.light) }
              : {}),
            ...(theme.colors.dark
              ? { dark: stripRemovedKeys(theme.colors.dark) }
              : {}),
          },
        },
      },
    };
  },
});
