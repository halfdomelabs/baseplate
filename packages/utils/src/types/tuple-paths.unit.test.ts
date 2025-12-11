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
});
