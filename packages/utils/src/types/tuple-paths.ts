type Primitive = string | number | boolean | symbol | null | undefined;

// Helper to convert string keys "0", "1" to number 0, 1
type ToNumber<T> = T extends `${infer N extends number}` ? N : never;

/**
 * Checks if a type is `any`.
 * Uses the fact that `any` extends everything, so `0 extends (1 & T)` is true when T is `any`.
 */
type IsAny<T> = 0 extends 1 & T ? true : false;

/**
 * Recursively generates a Union of all possible valid paths within Object `T`
 * formatted as Tuples.
 *
 * This handles:
 * - **Objects**: Uses string keys (e.g., `['user', 'name']`)
 * - **Tuples**: Uses specific numeric literal indices (e.g., `['coords', 0]`)
 * - **Arrays**: Uses generic `number` indices (e.g., `['tags', number]`)
 *
 * Includes safeguards:
 * - **IsAny Guard**: Immediately bails out when encountering `any` type
 * - **Depth Limiter**: Stops recursion after 10 levels to prevent infinite loops on recursive types
 *
 * @template T - The object or array to inspect.
 * @template D - Internal depth counter (defaults to 10, decrements on each recursive call)
 *
 * @example
 * // 1. Standard Object
 * type Obj = { user: { name: string } };
 * type P1 = TuplePaths<Obj>;
 * // Result: ['user'] | ['user', 'name']
 *
 * @example
 * // 2. Fixed-Length Tuple
 * type Tuple = { point: [number, number] };
 * type P2 = TuplePaths<Tuple>;
 * // Result: ['point'] | ['point', 0] | ['point', 1]
 *
 * @example
 * // 3. Generic Array
 * type List = { items: string[] };
 * type P3 = TuplePaths<List>;
 * // Result: ['items'] | ['items', number]
 */
// --- Main Type ---
export type TuplePaths<
  T,
  Depth extends number = 10,
  Stack extends unknown[] = [],
> =
  // 1. Stop Recursion if Depth limit reached
  Stack['length'] extends Depth
    ? never
    : // 2. Stop if 'any' is detected (Return never or any[] depending on preference)
      IsAny<T> extends true
      ? never
      : T extends Primitive
        ? never
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          T extends readonly any[]
          ? // Check if Generic Array or Tuple
            number extends T['length']
            ? // --- CASE A: Generic Array (e.g. User[]) ---
                | [number]
                | [number, ...TuplePaths<T[number], Depth, [...Stack, unknown]>]
            : // --- CASE B: Tuple (e.g. [string, number]) ---
              {
                [K in keyof T]: K extends `${number}`
                  ?
                      | [ToNumber<K>]
                      | [
                          ToNumber<K>,
                          ...TuplePaths<T[K], Depth, [...Stack, unknown]>,
                        ]
                  : never;
              }[number]
          : // --- CASE C: Object ---
            {
              [K in keyof T]:
                | [K]
                | [K, ...TuplePaths<T[K], Depth, [...Stack, unknown]>];
            }[keyof T];
