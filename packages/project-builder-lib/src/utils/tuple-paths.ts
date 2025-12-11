type Primitive = string | number | boolean | symbol | null | undefined;

/**
 *
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
          [K in keyof T]: K extends `${infer N extends number}`
            ? [N] | [N, ...TuplePaths<T[K]>]
            : never;
        }[keyof T]
    : // --- CASE C: Object ---
      {
        [K in keyof T]: [K] | [K, ...TuplePaths<T[K]>];
      }[keyof T];
