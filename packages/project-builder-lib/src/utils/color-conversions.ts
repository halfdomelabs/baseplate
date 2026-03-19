import type { Oklch } from 'culori';

import { converter, formatHex, parse } from 'culori';

/**
 * Parse an OKLCH color string into an Oklch object.
 * @param oklch - The OKLCH color string in format "oklch(l c h [/ a])" (e.g. "oklch(0.5 0.2 180 / 0.3)")
 * @returns The Oklch object
 */
export function parseOklch(color: string): Oklch {
  const parsedColor = parse(color);
  if (parsedColor?.mode !== 'oklch') {
    throw new Error(`Invalid OKLCH color string: ${color}`);
  }
  return parsedColor;
}

/**
 * Format an Oklch object into a canonical OKLCH string with consistent precision.
 * @param oklch - The Oklch object
 * @returns The OKLCH color string in format "oklch(l c h [/ a])" with 3 decimal places
 */
export function formatOklch(oklch: Oklch): string {
  return `oklch(${oklch.l.toFixed(3)} ${oklch.c.toFixed(3)} ${oklch.h?.toFixed(3) ?? 0}${
    oklch.alpha === undefined ? '' : ` / ${oklch.alpha.toFixed(3)}`
  })`;
}

/**
 * Normalize an OKLCH color string to canonical format (3 decimal places).
 * @param oklch - The OKLCH color string to normalize
 * @returns The normalized OKLCH color string
 */
export function normalizeOklch(oklch: string): string {
  return formatOklch(parseOklch(oklch));
}

/**
 * Convert an OKLCH color string to a hex color.
 * @param oklch - The OKLCH color string in format "l c h" (e.g. "0.5 0.2 180")
 * @returns The hex color string
 */
export function convertOklchToHex(oklch: string | Oklch): string {
  const color = typeof oklch === 'string' ? parseOklch(oklch) : oklch;
  const convert = converter('rgb');
  const rgb = convert(color);
  return formatHex(rgb);
}

/**
 * Convert a hex color to an OKLCH color string.
 * @param hex - The hex color string
 * @returns The OKLCH color string in format "oklch(l c h [/ a])"
 */
export function convertHexToOklch(hex: string): string {
  const convert = converter('oklch');
  const oklch = convert(hex);
  if (!oklch) {
    return 'oklch(0 0 0)';
  }
  return formatOklch(oklch);
}
