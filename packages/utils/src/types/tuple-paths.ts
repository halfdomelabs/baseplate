type Primitive = string | number | boolean | symbol | null | undefined;

// Helper to convert string keys "0", "1" to number 0, 1
type ToNumber<T> = T extends `${infer N extends number}` ? N : never;

/**
 * Recursively generates a Union of all possible valid paths within Object `T`
 * formatted as Tuples.
 *
 * This handles:
 * - **Objects**: Uses string keys (e.g., `['user', 'name']`)
 * - **Tuples**: Uses specific numeric literal indices (e.g., `['coords', 0]`)
 * - **Arrays**: Uses generic `number` indices (e.g., `['tags', number]`)
 *
 * @template T - The object or array to inspect.
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
export type TuplePaths<T> = T extends Primitive
  ? never
  : // eslint-disable-next-line @typescript-eslint/no-explicit-any
    T extends readonly any[]
    ? // Check if T is a Generic Array (length is just 'number') or a Tuple (length is literal)
      number extends T['length']
      ? // --- CASE A: Generic Array (e.g. User[]) ---
        // We cannot know the index, so we use `number` type
        [number] | [number, ...TuplePaths<T[number]>]
      : // --- CASE B: Tuple (e.g. [string, number]) ---
        // We iterate specific indices (0, 1, 2...)
        {
          [K in keyof T]: K extends `${number}` // Filter only numeric keys (0, 1, 2)
            ?
                | [ToNumber<K>] // The index itself
                | [ToNumber<K>, ...TuplePaths<T[K]>] // The index + children
            : never;
        }[number]
    : // --- CASE C: Object ---
      {
        [K in keyof T]: [K] | [K, ...TuplePaths<T[K]>];
      }[keyof T];
