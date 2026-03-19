import { describe, expect, it } from 'vitest';

import { migration030RemoveThemeHoverColors } from './migration-030-remove-theme-hover-colors.js';

describe('migration030RemoveThemeHoverColors', () => {
  it('strips hover and linkVisited keys from light and dark colors', () => {
    const oldConfig = {
      settings: {
        theme: {
          palettes: { base: {}, primary: {} },
          colors: {
            light: {
              background: 'oklch(1 0 0)',
              primary: 'oklch(0.4 0.2 265)',
              primaryHover: 'oklch(0.35 0.18 265)',
              secondaryHover: 'oklch(0.8 0.02 250)',
              destructiveHover: 'oklch(0.5 0.2 25)',
              linkVisited: 'oklch(0.42 0.18 265)',
              border: 'oklch(0.9 0.01 255)',
            },
            dark: {
              background: 'oklch(0.13 0.04 264)',
              primary: 'oklch(0.28 0.09 267)',
              primaryHover: 'oklch(0.42 0.18 265)',
              secondaryHover: 'oklch(0.45 0.04 257)',
              destructiveHover: 'oklch(0.5 0.2 25)',
              linkVisited: 'oklch(0.49 0.22 264)',
              border: 'oklch(0.28 0.04 260)',
            },
          },
        },
      },
    };

    const result = migration030RemoveThemeHoverColors.migrate(oldConfig);

    const { light, dark } = result.settings!.theme!.colors!;
    expect(light).not.toHaveProperty('primaryHover');
    expect(light).not.toHaveProperty('secondaryHover');
    expect(light).not.toHaveProperty('destructiveHover');
    expect(light).not.toHaveProperty('linkVisited');
    expect(light).toHaveProperty('background');
    expect(light).toHaveProperty('primary');
    expect(light).toHaveProperty('border');

    expect(dark).not.toHaveProperty('primaryHover');
    expect(dark).not.toHaveProperty('secondaryHover');
    expect(dark).not.toHaveProperty('destructiveHover');
    expect(dark).not.toHaveProperty('linkVisited');
    expect(dark).toHaveProperty('background');
    expect(dark).toHaveProperty('primary');
    expect(dark).toHaveProperty('border');
  });

  it('handles config without theme', () => {
    const oldConfig = {
      settings: {
        general: { name: 'test' },
      },
    };

    const result = migration030RemoveThemeHoverColors.migrate(oldConfig);

    expect(result).toEqual(oldConfig);
  });

  it('handles config without colors', () => {
    const oldConfig = {
      settings: {
        theme: {
          palettes: { base: {}, primary: {} },
        },
      },
    };

    const result = migration030RemoveThemeHoverColors.migrate(oldConfig);

    expect(result).toEqual(oldConfig);
  });

  it('handles colors that do not contain hover keys', () => {
    const oldConfig = {
      settings: {
        theme: {
          colors: {
            light: {
              background: 'oklch(1 0 0)',
              primary: 'oklch(0.4 0.2 265)',
            },
            dark: {
              background: 'oklch(0.13 0.04 264)',
              primary: 'oklch(0.28 0.09 267)',
            },
          },
        },
      },
    };

    const result = migration030RemoveThemeHoverColors.migrate(oldConfig);

    expect(result.settings!.theme!.colors!.light).toEqual({
      background: 'oklch(1 0 0)',
      primary: 'oklch(0.4 0.2 265)',
    });
  });
});
