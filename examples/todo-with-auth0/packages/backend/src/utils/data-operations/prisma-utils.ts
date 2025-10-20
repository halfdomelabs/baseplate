import type { PrismaTransaction } from './types.js';
import type {
  CreateInput,
  GetPayload,
  ModelPropName,
  UpdateInput,
  WhereInput,
  WhereUniqueInput,
} from './utility-types.js';

export type PrismaInclude = Record<
  string,
  true | { include?: PrismaInclude } | undefined
>;

function validateIncludeObject(obj: { include?: PrismaInclude }): void {
  const objKeys = Object.keys(obj);
  if (objKeys.length === 0) return;
  if (objKeys.length !== 1 || objKeys[0] !== 'include') {
    throw new Error(
      `Expected include object of shape {include?: PrismaInclude }. Got keys ${JSON.stringify(objKeys)}`,
    );
  }
}

function mergeIncludes(target: PrismaInclude, source: PrismaInclude): void {
  for (const [key, sourceValue] of Object.entries(source)) {
    const targetValue = target[key];

    if (sourceValue === undefined) continue;

    if (sourceValue === true) {
      // If the target is already a nested object, we don't need to overwrite it
      if (typeof targetValue === 'object' || targetValue === true) continue;
      target[key] = true;
    } else if (typeof sourceValue === 'object') {
      validateIncludeObject(sourceValue);
      // If the target is already a simple include, we need to overwrite it
      if (targetValue === true || targetValue === undefined) {
        target[key] = sourceValue;
      } else {
        // Otherwise, we merge the nested objects
        targetValue.include ??= {};
        if (sourceValue.include) {
          mergeIncludes(targetValue.include, sourceValue.include);
        }
      }
    } else {
      throw new TypeError(
        `Unknown source value found in mergeIncludes ${typeof sourceValue}`,
      );
    }
  }
}

/**
 * Merges multiple Prisma queries into a single optimized query.
 * Only include queries are supported - select queries are not allowed.
 *
 * Rules:
 * - Only include queries are accepted
 * - Include queries are deeply merged with validation
 * - Nested structures must only contain 'true' or '{ include: {...} }'
 * - Other keys (where, orderBy, select) are rejected
 *
 * @param queries - Array of queries to merge (only include supported)
 * @returns A single merged query with only include
 *
 * @example
 * ```typescript
 * mergePrismaQueries([
 *   { include: { profile: true } },
 *   { include: { posts: { include: { comments: true } } } },
 *   { include: { posts: { include: { author: true } } } }
 * ])
 * // Returns: {
 * //   include: {
 * //     posts: { include: { comments: true, author: true } },
 * //     profile: true
 * //   }
 * // }
 * ```
 */
export function mergePrismaQueries(queries: { include?: PrismaInclude }[]): {
  include?: PrismaInclude;
} {
  if (queries.length === 0) {
    return {};
  }

  const mergedInclude: PrismaInclude = {};

  for (const query of queries) {
    if (query.include) {
      mergeIncludes(mergedInclude, query.include);
    }
  }

  return { include: mergedInclude };
}

interface GenericPrismaDelegate<TModelName extends ModelPropName> {
  findUnique: (args: {
    where: WhereUniqueInput<TModelName>;
  }) => Promise<GetPayload<TModelName> | null>;
  findMany: (args: {
    where: WhereInput<TModelName>;
  }) => Promise<GetPayload<TModelName>[]>;
  create: (args: {
    data: CreateInput<TModelName>;
  }) => Promise<GetPayload<TModelName>>;
  update: (args: {
    where: WhereUniqueInput<TModelName>;
    data: UpdateInput<TModelName>;
  }) => Promise<GetPayload<TModelName>>;
  upsert: (args: {
    where: WhereUniqueInput<TModelName>;
    create: CreateInput<TModelName>;
    update: UpdateInput<TModelName>;
  }) => Promise<GetPayload<TModelName>>;
  delete: (args: {
    where: WhereUniqueInput<TModelName>;
  }) => Promise<GetPayload<TModelName>>;
  deleteMany: (args: {
    where: WhereInput<TModelName>;
  }) => Promise<{ count: number }>;
}

/**
 * Creates a generic Prisma delegate for a given model name.
 *
 * @param modelName - The name of the model to create a delegate for
 * @returns A generic Prisma delegate for the given model name
 */
export function makeGenericPrismaDelegate<TModelName extends ModelPropName>(
  tx: PrismaTransaction,
  modelName: TModelName,
): GenericPrismaDelegate<TModelName> {
  return tx[modelName] as unknown as GenericPrismaDelegate<TModelName>;
}
