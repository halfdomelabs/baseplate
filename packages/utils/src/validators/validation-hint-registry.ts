import { z } from 'zod';

/**
 * Registry that stores human-readable validation hints on Zod schema instances.
 *
 * Used by `buildTsDescriptionRegistry` to annotate TypeScript type output with
 * validation constraints (e.g., "camelCase", "CONSTANT_CASE") as JSDoc comments.
 *
 * Validators register hints at module load time. The registry is consumed
 * during schema-to-TypeScript conversion to produce annotated output.
 */
export const validationHintRegistry = z.registry<{
  description: string;
}>();
