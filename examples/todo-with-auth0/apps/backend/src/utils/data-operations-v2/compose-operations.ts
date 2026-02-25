import type {
  GetPayload,
  ModelPropName,
} from '../data-operations/prisma-types.js';
import type {
  AnyFieldDefinition,
  AnyOperationHooks,
  InferInput,
} from '../data-operations/types.js';
import type { ComposeCreateConfig, ComposeUpdateConfig } from './types.js';

import {
  checkGlobalAuthorization,
  checkInstanceAuthorization,
} from '../authorizers.js';
import { transformFields } from '../data-operations/define-operations.js';
import { CreatePlan, UpdatePlan } from './types.js';

/**
 * Compose a create operation plan.
 *
 * Processes field definitions via `transformFields`, collecting data transformations
 * and hooks. Returns an immutable plan that can be transformed via `mapData` and
 * `addHook` before committing.
 *
 * This is the pre-commit phase — field processing like `fileField` may do DB reads
 * for validation, so this is not a pure function.
 */
export async function composeCreate<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
>(
  config: ComposeCreateConfig<TModelName, TFields>,
): Promise<CreatePlan<TModelName, TFields>> {
  const { fields, input, context, authorize } = config;

  // Authorization — fail fast before field processing
  if (authorize && authorize.length > 0) {
    checkGlobalAuthorization(context, authorize);
  }

  const { data: fieldsData, hooks: fieldsHooks } = await transformFields(
    fields,
    input,
    {
      operation: 'create',
      serviceContext: context,
      allowOptionalFields: false,
      loadExisting: () => Promise.resolve(undefined),
    },
  );

  const hooks: Required<AnyOperationHooks> = {
    beforeExecute: [...(fieldsHooks.beforeExecute ?? [])],
    afterExecute: [...(fieldsHooks.afterExecute ?? [])],
    afterCommit: [...(fieldsHooks.afterCommit ?? [])],
  };

  return new CreatePlan({
    model: config.model,
    data: fieldsData.create,
    hooks,
    serviceContext: context,
  });
}

/**
 * Compose an update operation plan.
 *
 * Processes field definitions via `transformFields`, collecting data transformations
 * and hooks. The caller provides a `loadExisting` function that controls how the
 * existing item is fetched (e.g., with extra includes for authorization or diffing).
 *
 * Returns an immutable plan that can be transformed via `mapData` and `addHook`.
 */
export async function composeUpdate<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
>(
  config: ComposeUpdateConfig<TModelName, TFields>,
): Promise<UpdatePlan<TModelName, TFields>> {
  const {
    fields,
    input,
    context,
    loadExisting: rawLoadExisting,
    authorize,
  } = config;

  // Memoize loadExisting so multiple callers (authorization, field processing, developer inspection) share one fetch
  let cached: GetPayload<TModelName> | undefined;
  const loadExisting = async (): Promise<GetPayload<TModelName>> => {
    cached ??= await rawLoadExisting();
    return cached;
  };

  // Authorization — fail fast before field processing
  if (authorize && authorize.length > 0) {
    await checkInstanceAuthorization(context, loadExisting, authorize);
  }

  // Only transform fields present in input
  const fieldsToTransform = Object.fromEntries(
    Object.entries(fields).filter(([key]) => key in (input as object)),
  ) as TFields;

  const { data: fieldsData, hooks: fieldsHooks } = await transformFields(
    fieldsToTransform,
    input as InferInput<TFields>,
    {
      operation: 'update',
      serviceContext: context,
      allowOptionalFields: true,
      loadExisting: loadExisting as () => Promise<Record<string, unknown>>,
    },
  );

  const hooks: Required<AnyOperationHooks> = {
    beforeExecute: [...(fieldsHooks.beforeExecute ?? [])],
    afterExecute: [...(fieldsHooks.afterExecute ?? [])],
    afterCommit: [...(fieldsHooks.afterCommit ?? [])],
  };

  return new UpdatePlan({
    model: config.model,
    data: fieldsData.update,
    hooks,
    serviceContext: context,
    loadExisting,
  });
}
