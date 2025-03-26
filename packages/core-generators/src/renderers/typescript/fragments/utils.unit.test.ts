import { describe, expect, it } from 'vitest';

import type { TsCodeFragment } from './types.js';

import { flattenImportsAndHoistedFragments } from './utils.js';

describe('flattenImportsAndHoistedFragments', () => {
  it('should handle empty fragments array', () => {
    const result = flattenImportsAndHoistedFragments([]);
    expect(result).toEqual({
      imports: [],
      hoistedFragments: [],
    });
  });

  it('should flatten imports from multiple fragments', () => {
    const fragments: TsCodeFragment[] = [
      {
        contents: 'const a = 1;',
        imports: [{ source: 'module-a', namedImports: [{ name: 'A' }] }],
      },
      {
        contents: 'const b = 2;',
        imports: [{ source: 'module-b', namedImports: [{ name: 'B' }] }],
      },
    ];

    const result = flattenImportsAndHoistedFragments(fragments);
    expect(result.imports).toHaveLength(2);
    expect(result.imports).toEqual([
      { source: 'module-a', namedImports: [{ name: 'A' }] },
      { source: 'module-b', namedImports: [{ name: 'B' }] },
    ]);
  });

  it('should handle nested hoisted fragments with correct priorities', () => {
    const nestedFragment: TsCodeFragment = {
      contents: 'const nested = true;',
      hoistedFragments: [
        {
          key: 'nested-type',
          fragment: {
            contents: 'type NestedType = string;',
          },
        },
      ],
    };

    const fragments: TsCodeFragment[] = [
      {
        contents: 'const root = true;',
        hoistedFragments: [
          {
            key: 'root-type',
            fragment: nestedFragment,
          },
        ],
      },
    ];

    const result = flattenImportsAndHoistedFragments(fragments);
    expect(result.hoistedFragments).toHaveLength(2);

    // Check that root-type has lower priority than nested-type
    const rootType = result.hoistedFragments.find((f) => f.key === 'root-type');
    const nestedType = result.hoistedFragments.find(
      (f) => f.key === 'nested-type',
    );
    expect(rootType).toBeDefined();
    expect(nestedType).toBeDefined();
  });

  it('should deduplicate hoisted fragments by key', () => {
    const fragments: TsCodeFragment[] = [
      {
        contents: 'const a = 1;',
        hoistedFragments: [
          {
            key: 'duplicate-key',
            position: 'afterImports',
            fragment: {
              contents: 'type DuplicateKey = number;',
              hoistedFragments: [],
            },
          },
        ],
      },
      {
        contents: 'const b = 2;',
        hoistedFragments: [
          {
            key: 'duplicate-key',
            position: 'afterImports',
            fragment: {
              contents: 'type DuplicateKey = number;',
              hoistedFragments: [],
            },
          },
        ],
      },
    ];

    const result = flattenImportsAndHoistedFragments(fragments);
    expect(result.hoistedFragments).toHaveLength(1);
    expect(result.hoistedFragments[0].key).toBe('duplicate-key');
    expect(result.hoistedFragments[0].fragment.contents).toBe(
      'type DuplicateKey = number;',
    );
  });

  it('should order hoisted fragments by priority (highest to lowest) and then by key', () => {
    const fragments: TsCodeFragment[] = [
      {
        contents: 'const a = 1;',
        hoistedFragments: [
          {
            key: 'b-key', // alphabetically second
            position: 'afterImports',
            fragment: {
              contents: 'type B = string;',
            },
          },
          {
            key: 'a-key', // alphabetically first
            position: 'afterImports',
            fragment: {
              contents: 'type A = string;',
            },
          },
        ],
      },
      {
        contents: 'const b = 2;',
        hoistedFragments: [
          {
            key: 'c-key', // alphabetically third
            position: 'afterImports',
            fragment: {
              contents: 'type C = string;',
              hoistedFragments: [
                {
                  key: 'z-nested-key', // nested, so higher priority despite alphabetically last
                  position: 'afterImports',
                  fragment: {
                    contents: 'type Z = string;',
                  },
                },
              ],
            },
          },
        ],
      },
    ];

    const result = flattenImportsAndHoistedFragments(fragments);
    expect(result.hoistedFragments).toHaveLength(4);

    // Check ordering: nested fragment should come first (highest priority)
    // then root fragments in alphabetical order by key
    expect(result.hoistedFragments[0].key).toBe('z-nested-key');
    expect(result.hoistedFragments[1].key).toBe('a-key');
    expect(result.hoistedFragments[2].key).toBe('b-key');
    expect(result.hoistedFragments[3].key).toBe('c-key');
  });
});
