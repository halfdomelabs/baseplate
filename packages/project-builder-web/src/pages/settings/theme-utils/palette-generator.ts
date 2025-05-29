import type { ColorPalette } from '@halfdomelabs/project-builder-lib';
import type { Rgb } from 'culori';

import { PALETTE_SHADES } from '@halfdomelabs/project-builder-lib';
import { converter, formatHex } from 'culori';

import { generatePaletteNN } from './palette-neural-net.js';

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

  return Object.fromEntries(
    PALETTE_SHADES.map((shade) => {
      const shadeRgb: Rgb = {
        mode: 'rgb',
        r: newPalette[getPaletteKey(shade, 'r')],
        g: newPalette[getPaletteKey(shade, 'g')],
        b: newPalette[getPaletteKey(shade, 'b')],
      };
      return [shade, formatHex(shadeRgb)];
    }),
  ) as ColorPalette;
}
