import type { ColorPaletteName, PaletteShade } from '#src/constants/colors.js';

import { COLOR_PALETTES, FIXED_COLOR_MAPPINGS } from '#src/constants/colors.js';

import { convertOklchToHex } from './color-conversions.js';

/**
 * Convert a color name to a hex color. Can be one of the following:
 * - A fixed color name (e.g. 'white', 'black').
 * - A color palette name (e.g. 'slate-500', 'gray-300').
 * - A hex color (e.g. '#ff0000').
 * - A OKLCH color (e.g. 'oklch(0.5 0.2 180 / 0.3)').
 *
 * @param color - The color name to convert.
 * @returns The OKLCH color.
 */
export function convertColorNameToOklch(color: string): string {
  const fixedColorMapping = FIXED_COLOR_MAPPINGS[color];
  if (fixedColorMapping) {
    return fixedColorMapping;
  }
  const colorComponents = color.split('-');
  if (colorComponents.length === 2) {
    const paletteName = colorComponents[0];
    if (Object.prototype.hasOwnProperty.call(COLOR_PALETTES, paletteName)) {
      const palette = COLOR_PALETTES[colorComponents[0] as ColorPaletteName];
      const shade = palette[colorComponents[1] as PaletteShade];
      if (shade) {
        return shade;
      }
    }
  }
  return color;
}

let reverseColorMapping: Record<string, string> | null = null;

function getReverseColorMapping(): Record<string, string> {
  if (!reverseColorMapping) {
    reverseColorMapping = {};
    for (const [key, value] of Object.entries(FIXED_COLOR_MAPPINGS)) {
      reverseColorMapping[value] = key;
    }
    for (const [paletteName, palette] of Object.entries(COLOR_PALETTES)) {
      for (const [shade, hex] of Object.entries(palette)) {
        reverseColorMapping[hex] = `${paletteName}-${shade}`;
      }
    }
  }
  return reverseColorMapping;
}

/**
 * Convert an OKLCH color to a color name.
 * @param oklch - The OKLCH color to convert.
 * @returns The color name.
 */
export function convertOklchToColorName(oklch: string): string {
  return getReverseColorMapping()[oklch] ?? convertOklchToHex(oklch);
}
