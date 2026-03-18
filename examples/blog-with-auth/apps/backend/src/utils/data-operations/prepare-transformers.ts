import type { ServiceContext } from '../service-context.js';
import type {
  AfterExecuteHook,
  AnyBoundTransformer,
  InferTransformed,
  TransformPlan,
} from './transformer-types.js';

/**
 * Configuration for `prepareTransformers`.
 *
 * @template TTransformers - Record of bound transformers (from `.forCreate()` / `.forUpdate()`)
 */
export interface PrepareTransformersConfig<
  TTransformers extends Record<string, AnyBoundTransformer>,
> {
  /** Bound transformers to process. Each should be the result of `.forCreate()` or `.forUpdate()`. */
  transformers: TTransformers;
  /** Service context with user info, request details, etc. */
  serviceContext: ServiceContext;
}

/**
 * Process all bound transformers and collect their results into a `TransformPlan`.
 *
 * Each bound transformer's `process` method is called to produce Prisma-compatible
 * data and optional afterExecute hooks. The results are aggregated into a plan
 * that can be passed to `executeTransformPlan`.
 *
 * @template TTransformers - Record of bound transformers
 * @param config - Configuration with bound transformers and service context
 * @returns A `TransformPlan` with resolved data and collected hooks
 *
 * @example
 * ```typescript
 * const plan = await prepareTransformers({
 *   transformers: {
 *     coverPhoto: coverPhotoTransformer.forCreate(coverPhoto),
 *   },
 *   serviceContext,
 * });
 * ```
 */
export async function prepareTransformers<
  TTransformers extends Record<string, AnyBoundTransformer>,
>(
  config: PrepareTransformersConfig<TTransformers>,
): Promise<TransformPlan<TTransformers>> {
  const { transformers, serviceContext } = config;

  const entries = Object.entries(transformers);
  const results = await Promise.all(
    entries.map(async ([, boundTransformer]) =>
      boundTransformer.process({ serviceContext }),
    ),
  );

  const transformed = {} as InferTransformed<TTransformers>;
  const afterExecute: AfterExecuteHook[] = [];

  for (const [index, result] of results.entries()) {
    const key = entries[index][0];
    (transformed as Record<string, unknown>)[key] = result.data;

    if (result.afterExecute) {
      afterExecute.push(...result.afterExecute);
    }
  }

  return { transformed, afterExecute };
}
