import {
  COLOR_PALETTES,
  ColorPaletteName,
  FIXED_COLOR_MAPPINGS,
  PaletteShade,
} from '@src/constants/colors.js';

/**
 * Convert a color name to a hex color. Can be one of the following:
 * - A fixed color name (e.g. 'white', 'black').
 * - A color palette name (e.g. 'slate-500', 'gray-300').
 * - A hex color (e.g. '#ff0000').
 *
 * @param color - The color name to convert.
 * @returns The hex color.
 */
export function convertColorNameToHex(color: string): string {
  const fixedColorMapping = FIXED_COLOR_MAPPINGS[color];
  if (fixedColorMapping) {
    return fixedColorMapping;
  }
  const colorComponents = color.split('-');
  if (colorComponents.length === 2) {
    const palette = COLOR_PALETTES[colorComponents[0] as ColorPaletteName];
    if (palette) {
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
    reverseColorMapping = Object.entries(FIXED_COLOR_MAPPINGS).reduce(
      (acc, [key, value]) => {
        acc[value] = key;
        return acc;
      },
      {} as Record<string, string>,
    );
    Object.entries(COLOR_PALETTES).forEach(([paletteName, palette]) => {
      Object.entries(palette).forEach(([shade, hex]) => {
        reverseColorMapping![hex] = `${paletteName}-${shade}`;
      });
    });
  }
  return reverseColorMapping;
}

export function convertHexToColorName(hex: string): string {
  return getReverseColorMapping()[hex] ?? hex;
}
