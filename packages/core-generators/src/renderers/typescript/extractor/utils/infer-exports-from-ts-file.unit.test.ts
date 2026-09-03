import { describe, expect, it } from 'vitest';

import { inferExportsFromTsSource } from './infer-exports-from-ts-file.js';

describe('inferExportsFromTsSource', () => {
  it('reports the kind of each export', () => {
    const { exports, hasStarExports } = inferExportsFromTsSource(
      '/project/src/example.ts',
      `
        export const value = 1;
        export interface Shape {}
        export type Alias = string;
        export default function main(): void {}
      `,
    );

    expect(hasStarExports).toBe(false);
    expect(exports.get('value')).toEqual({ isTypeOnly: false });
    expect(exports.get('Shape')).toEqual({ isTypeOnly: true });
    expect(exports.get('Alias')).toEqual({ isTypeOnly: true });
    expect(exports.get('default')).toEqual({
      isDefault: true,
      isTypeOnly: false,
    });
    // `main` is only reachable as the default export
    expect(exports.has('main')).toBe(false);
  });

  it('marks type-only re-exports', () => {
    const { exports } = inferExportsFromTsSource(
      '/project/src/example.ts',
      `export type { Shape } from './shape.js';`,
    );

    expect(exports.get('Shape')).toEqual({ isTypeOnly: true });
  });

  it('flags star re-exports', () => {
    const { exports, hasStarExports } = inferExportsFromTsSource(
      '/project/src/example.ts',
      `export * from './other.js';`,
    );

    expect(hasStarExports).toBe(true);
    expect(exports.size).toBe(0);
  });
});
