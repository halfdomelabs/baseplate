import { describe, expect, it } from 'vitest';

import { sortByImportOrder } from './import-order.js';

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
    expect(sortByImportOrder(input.toReversed(), {})).toEqual([
      'fs',
      'chalk',
      '../foo',
      './bar',
      './',
    ]);
  });

  it('sorts folders and subfolders', () => {
    const input = ['./', '../bar', '../../foo/bar'];
    const expected = ['../../foo/bar', '../bar', './'];

    expect(sortByImportOrder(input, {})).toEqual(expected);
    expect(sortByImportOrder(input.toReversed(), {})).toEqual(expected);
  });
});
