import { flow } from 'es-toolkit';

import { convertHexToOklch } from '#src/utils/color-conversions.js';

import { transformJsonPath } from './transform-json-path.js';
import { createSchemaMigration } from './types.js';

function transformThemeColor(color: string): string {
  if (color.startsWith('oklch')) return color;
  if (color.startsWith('#')) return convertHexToOklch(color);
  throw new Error(`Invalid color: ${color}`);
}

export const migration010HexToOklch = createSchemaMigration<
  Record<string, unknown>,
  unknown
>({
  version: 10,
  name: 'hexToOklch',
  description: 'Convert hex colors to OKLCH in theme configuration',
  migrate: (config) => {
    if (!config.theme) {
      return config;
    }

    const transform = flow(
      (c) =>
        transformJsonPath(
          c,
          'theme.palettes.**.customBase',
          transformThemeColor,
        ),
      (c) =>
        transformJsonPath(
          c,
          'theme.palettes.**.shades.**',
          transformThemeColor,
        ),
      (c) => transformJsonPath(c, 'theme.colors.**.**', transformThemeColor),
    );

    return transform(config);
  },
});
