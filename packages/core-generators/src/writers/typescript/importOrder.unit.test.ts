import * as R from 'ramda';
import { describe, it, expect } from 'vitest';

import { sortByImportOrder } from './importOrder.js';

describe('sortByImportOrder', () => {
  it('sorts an empty array', () => {
    expect(sortByImportOrder([], {})).toEqual([]);
  });

  it('sorts simple built in/external/internal', () => {
    const input = ['chalk', './', './bar', 'fs', '../foo'];

    expect(sortByImportOrder(input, {})).toEqual([
      'fs',
      'chalk',
      '../foo',
      './bar',
      './',
    ]);
    expect(sortByImportOrder(R.reverse(input), {})).toEqual([
      'fs',
      'chalk',
      '../foo',
      './bar',
      './',
    ]);
  });
});
