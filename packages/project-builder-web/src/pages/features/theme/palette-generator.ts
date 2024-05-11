import {
  ColorPalette,
  PALETTE_SHADES,
} from '@halfdomelabs/project-builder-lib';
import { converter, Rgb, formatHex } from 'culori';

import { generatePaletteNN } from './palette-neural-net';

function getPaletteKey(shade: string, component: string): string {
  return `${shade}-${component}`;
}

export function generatePalette(baseColor: string): ColorPalette {
  const convertToRgb = converter('rgb');

  const rgb = convertToRgb(baseColor);

  if (!rgb) {
    throw new Error(`Invalid color: ${baseColor}`);
  }

  const newPalette = generatePaletteNN(rgb);

  return PALETTE_SHADES.reduce((acc, shade) => {
    const shadeRgb: Rgb = {
      mode: 'rgb',
      r: newPalette[getPaletteKey(shade, 'r')],
      g: newPalette[getPaletteKey(shade, 'g')],
      b: newPalette[getPaletteKey(shade, 'b')],
    };
    acc[shade] = formatHex(shadeRgb);
    return acc;
  }, {} as ColorPalette);
}
