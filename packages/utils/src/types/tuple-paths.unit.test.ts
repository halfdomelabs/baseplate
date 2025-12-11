import { describe, expectTypeOf, test } from 'vitest';

import type { TuplePaths } from './tuple-paths.js';

describe('TuplePaths Type Definitions', () => {
  test('Case 1: Simple Object', () => {
    interface User {
      name: string;
      age: number;
    }

    type Result = TuplePaths<User>;

    // Exact Match: Must be exactly these two paths
    expectTypeOf<Result>().toEqualTypeOf<['name'] | ['age']>();
  });

  test('Case 2: Fixed-Length Tuple', () => {
    // A tuple implies specific indices: 0 and 1
    interface Point {
      coords: [number, number];
    }

    type Result = TuplePaths<Point>;

    type Expected = ['coords'] | ['coords', 0] | ['coords', 1];

    expectTypeOf<Result>().toEqualTypeOf<Expected>();
  });

  test('Case 3: Generic Array', () => {
    // A generic array implies unknown indices (represented as `number`)
    interface Tags {
      list: string[];
    }

    type Result = TuplePaths<Tags>;

    // We expect the index to be 'number', not specific literals like 0 or 1
    type Expected = ['list'] | ['list', number];

    expectTypeOf<Result>().toEqualTypeOf<Expected>();
  });

  test('Case 4: Deeply Nested Mixed Types', () => {
    interface Complex {
      users: [
        {
          id: string;
          posts: [{ title: string }]; // Tuple inside object inside tuple
        },
      ];
    }

    type Result = TuplePaths<Complex>;

    type Expected =
      | ['users']
      | ['users', 0]
      | ['users', 0, 'id']
      | ['users', 0, 'posts']
      | ['users', 0, 'posts', 0]
      | ['users', 0, 'posts', 0, 'title'];

    expectTypeOf<Result>().toEqualTypeOf<Expected>();
  });

  test('Negative Test: Should not allow invalid paths', () => {
    interface Data {
      config: [string];
    }
    type Result = TuplePaths<Data>;

    // Verify that incorrect paths do NOT extend the result
    // equivalent to "not.toExtend"
    expectTypeOf<['config', 'invalid_prop']>().not.toExtend<Result>();

    // Verify that string indices on tuples are rejected
    expectTypeOf<['config', '0']>().not.toExtend<Result>();
  });

  test('IsAny Guard: Should handle any type without excessive depth', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type Result = TuplePaths<any>;

    // Should return never instead of causing type instantiation errors
    expectTypeOf<Result>().toEqualTypeOf<never>();
  });

  test('IsAny Guard: Should handle objects with any properties', () => {
    interface DataWithAny {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value: any;
      name: string;
    }

    type Result = TuplePaths<DataWithAny>;

    // Should include valid paths but not recurse into any
    expectTypeOf<Result>().toEqualTypeOf<['value'] | ['name']>();
  });

  test('Depth Limiter: Should handle recursive types without infinite recursion', () => {
    interface Node {
      value: string;
      child: Node;
    }

    type Result = TuplePaths<Node>;

    // Should generate paths up to depth limit, then stop
    // This test verifies it doesn't cause "Type instantiation is excessively deep" error
    expectTypeOf<['value']>().toExtend<Result>();
    expectTypeOf<['child']>().toExtend<Result>();
    expectTypeOf<['child', 'value']>().toExtend<Result>();
    expectTypeOf<['child', 'child']>().toExtend<Result>();
  });

  test('Depth Limiter: Should handle deeply nested structures', () => {
    interface Level1 {
      level2: {
        level3: {
          level4: {
            level5: {
              level6: {
                level7: {
                  level8: {
                    level9: {
                      level10: {
                        level11: string;
                      };
                    };
                  };
                };
              };
            };
          };
        };
      };
    }

    type Result = TuplePaths<Level1>;

    // Should handle deep nesting without errors
    expectTypeOf<['level2']>().toExtend<Result>();
    expectTypeOf<
      [
        'level2',
        'level3',
        'level4',
        'level5',
        'level6',
        'level7',
        'level8',
        'level9',
        'level10',
      ]
    >().toExtend<Result>();
  });
});
