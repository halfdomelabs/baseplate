import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { describe, expect, it } from 'vitest';

import { buildTakeArgFragment, buildTakeValue } from './page-size.js';

/**
 * Renders a fragment's contents for assertion. Fragments are emitted
 * unformatted (Prettier runs later in the pipeline), so whitespace is
 * normalised away to keep expectations readable.
 */
function render(fragment: TsCodeFragment): string {
  return fragment.contents.replaceAll(/\s+/g, ' ').trim();
}

describe('buildTakeArgFragment', () => {
  it('caps the argument when a max page size is set', () => {
    expect(render(buildTakeArgFragment(50))).toBe(
      't.arg.int({ validate: z.int().min(0).max(50) })',
    );
  });

  it('leaves the argument uncapped when no max is set', () => {
    expect(render(buildTakeArgFragment())).toBe(
      't.arg.int({ validate: z.int().min(0) })',
    );
  });
});

describe('buildTakeValue', () => {
  it('falls back to the default page size when the caller supplies none', () => {
    expect(buildTakeValue('take', { defaultPageSize: 25 })).toBe('take ?? 25');
  });

  it('falls back to the max when only a cap is set', () => {
    // The arg validator only constrains an explicit `take`, so without this the
    // caller omits the arg and the cap is bypassed entirely.
    expect(buildTakeValue('take', { maxPageSize: 50 })).toBe('take ?? 50');
  });

  it('prefers the default over the max when both are set', () => {
    expect(
      buildTakeValue('take', { defaultPageSize: 25, maxPageSize: 50 }),
    ).toBe('take ?? 25');
  });

  it('stays unbounded when neither limit is set', () => {
    expect(buildTakeValue('take')).toBe('take ?? undefined');
  });

  it('uses the given argument expression for relation fields', () => {
    expect(buildTakeValue('args.take', { defaultPageSize: 25 })).toBe(
      'args.take ?? 25',
    );
  });
});
