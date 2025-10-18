import type { z } from 'zod';

import type { FieldDefinition } from './types.js';

/**
 * Create a simple scalar field with validation only
 *
 * This helper creates a field definition that validates input using a Zod schema.
 * The validated value is passed through unchanged to the transform step.
 *
 * For relation fields (e.g., `userId`), use this helper to validate the ID,
 * then use relation helpers in the transform step to create Prisma connect/disconnect objects.
 *
 * @param schema - Zod schema for validation
 * @returns Field definition
 *
 * @example
 * ```typescript
 * const fields = {
 *   title: scalarField(z.string()),
 *   ownerId: scalarField(z.string()), // Validated as string
 * };
 *
 * // In transform, convert IDs to relations:
 * transform: (data) => ({
 *   title: data.title,
 *   owner: relation.required(data.ownerId),
 * })
 * ```
 */
export function scalarField<TSchema extends z.ZodSchema>(
  schema: TSchema,
): FieldDefinition<
  z.input<TSchema>,
  z.output<TSchema>,
  z.output<TSchema>,
  z.output<TSchema>
> {
  return {
    processInput: (value) => {
      const validated = schema.parse(value) as z.output<TSchema>;
      return {
        data: { create: validated, update: validated },
      };
    },
  };
}
