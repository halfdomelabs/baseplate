import { type RefinementCtx, z, type ZodTypeAny } from 'zod';

/**
 * Transforms a value using a dynamic schema and forwards any issues to transform context.
 *
 * Note: This does not change the return type of the schema.
 *
 * @param schemaFn - A function returning a Zod schema based on the current object.
 */
export function transformWithDynamicSchema<TData extends object>(
  schemaFn: (data: TData) => ZodTypeAny | undefined,
  valuePath?: keyof TData,
): (data: TData, ctx: RefinementCtx) => TData {
  return (data, ctx) => {
    const schema = schemaFn(data);

    if (!schema) {
      return data;
    }

    const result = schema.safeParse(
      (valuePath ? data[valuePath] : data) ?? undefined,
    );

    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          ...issue,
          path: [...(valuePath ? [valuePath as string] : []), ...issue.path],
        });
      }
      return z.NEVER;
    }

    return valuePath
      ? {
          ...data,
          [valuePath]: result.data as TData[typeof valuePath],
        }
      : (result.data as TData);
  };
}
