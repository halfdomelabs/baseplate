import { dasherize, underscore } from 'inflection';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

import type { ThemeColorKey } from '#src/constants/theme-colors.js';

import { THEME_COLORS } from '#src/constants/theme-colors.js';
import {
  generateCssFromThemeConfig,
  generateDefaultTheme,
} from '#src/utils/theme.js';

function cssVarNameForKey(key: ThemeColorKey): string {
  return `--${dasherize(underscore(key))}`;
}

/**
 * Extracts `--key: value;` declarations from the first CSS rule whose
 * selector matches `selectorPrefix` in `css`.
 */
function extractCssVars(
  css: string,
  selectorPrefix: string,
): Record<string, string> {
  const ruleStart = css.indexOf(selectorPrefix);
  if (ruleStart === -1) {
    throw new Error(`Could not find selector "${selectorPrefix}" in CSS`);
  }
  const braceStart = css.indexOf('{', ruleStart);
  const braceEnd = css.indexOf('}', braceStart);
  const body = css.slice(braceStart + 1, braceEnd);

  const vars: Record<string, string> = {};
  for (const match of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    const [, key, value] = match;
    if (key && value) {
      vars[key] = value.trim();
    }
  }
  return vars;
}

/**
 * ui-components' base-styles.css hand-authors a default light/dark palette
 * that must stay in sync with THEME_COLORS' `surface`-category defaults
 * (background/foreground/muted/card/popover/accent/success/warning/error).
 * `interactive`/`utility` colors (primary/secondary/destructive/link/border/
 * input/ring) are intentionally hand-tuned brand colors and are not checked
 * here.
 */
describe('base-styles.css default palette', () => {
  const require = createRequire(import.meta.url);
  const baseStylesCssPath =
    require.resolve('@baseplate-dev/ui-components/base-styles.css');
  const baseStylesCss = readFileSync(baseStylesCssPath, 'utf8');

  const surfaceColorKeys = Object.entries(THEME_COLORS)
    .filter(([, config]) => config.category === 'surface')
    .map(([key]) => key as ThemeColorKey);

  const defaultTheme = generateDefaultTheme();
  const expectedLightVars = generateCssFromThemeConfig(
    defaultTheme.colors.light,
  );
  const expectedDarkVars = generateCssFromThemeConfig(defaultTheme.colors.dark);

  it.each(surfaceColorKeys)(
    'light default for "%s" matches theme-colors.ts',
    (key) => {
      const actualVars = extractCssVars(baseStylesCss, ':root {');
      const cssVarName = cssVarNameForKey(key);
      expect(actualVars[cssVarName]).toBe(expectedLightVars[cssVarName]);
    },
  );

  it.each(surfaceColorKeys)(
    'dark default for "%s" matches theme-colors.ts',
    (key) => {
      const actualVars = extractCssVars(
        baseStylesCss,
        ".dark,\nhtml[data-theme='dark'] {",
      );
      const cssVarName = cssVarNameForKey(key);
      expect(actualVars[cssVarName]).toBe(expectedDarkVars[cssVarName]);
    },
  );
});
