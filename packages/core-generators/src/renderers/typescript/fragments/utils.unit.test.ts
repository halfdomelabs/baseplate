import { describe, expect, it } from 'vitest';

import type { TsCodeFragment, TsHoistedFragment } from './types.js';

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
        imports: [
          { moduleSpecifier: 'module-a', namedImports: [{ name: 'A' }] },
        ],
      },
      {
        contents: 'const b = 2;',
        imports: [
          { moduleSpecifier: 'module-b', namedImports: [{ name: 'B' }] },
        ],
      },
    ];

    const result = flattenImportsAndHoistedFragments(fragments);
    expect(result.imports).toHaveLength(2);
    expect(result.imports).toEqual([
      { moduleSpecifier: 'module-a', namedImports: [{ name: 'A' }] },
      { moduleSpecifier: 'module-b', namedImports: [{ name: 'B' }] },
    ]);
  });

  it('should handle nested hoisted fragments with correct ordering', () => {
    const nestedFragment: TsHoistedFragment = {
      key: 'nested-type',
      contents: 'type NestedType = string;',
    };

    const fragments: TsCodeFragment[] = [
      {
        contents: 'const root = true;',
        hoistedFragments: [
          {
            key: 'root-type',
            contents: 'type RootType = string;',
            hoistedFragments: [nestedFragment],
          },
        ],
      },
    ];

    const result = flattenImportsAndHoistedFragments(fragments);
    expect(result.hoistedFragments[0].key).toBe('nested-type');
    expect(result.hoistedFragments[1].key).toBe('root-type');
  });

  it('should deduplicate hoisted fragments by key', () => {
    const fragments: TsCodeFragment[] = [
      {
        contents: 'const a = 1;',
        hoistedFragments: [
          {
            key: 'duplicate-key',
            contents: 'type DuplicateKey = number;',
            hoistedFragments: [],
          },
        ],
      },
      {
        contents: 'const b = 2;',
        hoistedFragments: [
          {
            key: 'duplicate-key',
            contents: 'type DuplicateKey = number;',
            hoistedFragments: [],
          },
        ],
      },
    ];

    const result = flattenImportsAndHoistedFragments(fragments);
    expect(result.hoistedFragments).toHaveLength(1);
    expect(result.hoistedFragments[0].key).toBe('duplicate-key');
    expect(result.hoistedFragments[0].contents).toBe(
      'type DuplicateKey = number;',
    );
  });

  it('should order hoisted fragments by locality-based topological sort and then by key', () => {
    const fragments: TsCodeFragment[] = [
      {
        contents: 'const a = 1;',
        hoistedFragments: [
          {
            key: 'b-key', // alphabetically second
            contents: 'type B = string;',
          },
          {
            key: 'a-key', // alphabetically first
            contents: 'type A = string;',
          },
        ],
      },
      {
        contents: 'const b = 2;',
        hoistedFragments: [
          {
            key: 'c-key', // alphabetically third
            contents: 'type C = string;',
            hoistedFragments: [
              {
                key: 'z-nested-key', // nested, so next to c-key despite alphabetically last
                contents: 'type Z = string;',
              },
            ],
          },
        ],
      },
    ];

    const result = flattenImportsAndHoistedFragments(fragments);
    expect(result.hoistedFragments).toHaveLength(4);

    // Check ordering: nested fragment should come before c-key
    // and root fragments should be in alphabetical order by key
    expect(result.hoistedFragments.map((h) => h.key)).toEqual([
      'a-key',
      'b-key',
      'z-nested-key',
      'c-key',
    ]);
  });
});
