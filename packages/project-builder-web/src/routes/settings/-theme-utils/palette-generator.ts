import type { ColorPalette } from '@baseplate-dev/project-builder-lib';
import type { Rgb } from 'culori';

import { PALETTE_SHADES } from '@baseplate-dev/project-builder-lib';
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
      const r = newPalette[getPaletteKey(shade, 'r')];
      const g = newPalette[getPaletteKey(shade, 'g')];
      const b = newPalette[getPaletteKey(shade, 'b')];
      if (r === undefined || g === undefined || b === undefined) {
        throw new Error(`Generated palette is missing shade ${shade}`);
      }
      const shadeRgb: Rgb = { mode: 'rgb', r, g, b };
      return [shade, formatHex(shadeRgb)];
    }),
  ) as ColorPalette;
}
