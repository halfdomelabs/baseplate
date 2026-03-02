import type { z, ZodArray } from 'zod';

/**
 * A merge rule attached to a Zod schema node via `withMergeRule`.
 * Controls how `mergeDataWithSchema` combines current and desired values at that node.
 *
 * - `replace`: Always replace current with desired (same as default leaf behavior)
 * - `by-key`: Merge array items by key — items in current not present in desired are kept
 */
export type MergeRule =
  | { readonly kind: 'replace' }
  | {
      readonly kind: 'by-key';
      readonly getKey: (item: unknown) => string;
    };

/**
 * Registry that stores merge rule metadata on Zod schema instances.
 *
 * Uses a WeakMap to avoid interfering with Zod's type system.
 * Annotated by `withMergeRule()`; read by `mergeDataWithSchema()`.
 */
const mergeRuleRegistry = new WeakMap<z.ZodType, MergeRule>();

/**
 * Retrieves the merge rule attached to a schema node, if any.
 */
export function getMergeRule(schema: z.ZodType): MergeRule | undefined {
  return mergeRuleRegistry.get(schema);
}

/**
 * Creates a schema decorator that registers a merge rule on the schema node.
 *
 * ```typescript
 * z.object({ ... }).apply(withMergeRule({ kind: 'replace' }))
 * ```
 *
 * @param rule - The merge rule to attach
 * @returns A function that decorates a schema with the rule
 */
export function withMergeRule(
  rule: MergeRule,
): <T extends z.ZodType>(schema: T) => T {
  return <T extends z.ZodType>(schema: T): T => {
    mergeRuleRegistry.set(schema, rule);
    return schema;
  };
}

/**
 * Creates a schema decorator that registers a `by-key` merge rule on an array schema.
 *
 * Infers the element type from the array schema so `getKey` is strongly typed.
 *
 * ```typescript
 * z
 *   .array(z.object({ ref: z.string(), value: z.number() }))
 *   .apply(withByKeyMergeRule({ getKey: (item) => item.ref }))
 * ```
 *
 * @param options - Options with a typed `getKey` function
 * @returns A schema decorator that annotates the array node with a by-key merge rule
 */
export function withByKeyMergeRule<T extends ZodArray>(options: {
  getKey: (item: z.output<T>[number]) => string;
}): (schema: T) => T {
  return (schema: T) => {
    mergeRuleRegistry.set(schema, {
      kind: 'by-key',
      getKey: options.getKey as (item: unknown) => string,
    });
    return schema;
  };
}
