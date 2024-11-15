import { z } from 'zod';

import type { ProjectDefinitionContainer } from '@src/definition/project-definition-container.js';

export const baseTransformerFields = {
  type: z.string().min(1),
} as const;

export const baseTransformerSchema = z.object({
  id: z.string(),
  ...baseTransformerFields,
});

export interface ModelTransformerType<T extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  schema: T;
  getName: (
    definitionContainer: ProjectDefinitionContainer,
    definition: z.infer<T>,
  ) => string;
}

export function createModelTransformerType<T extends z.ZodTypeAny>(
  payload: ModelTransformerType<T>,
): ModelTransformerType<T> {
  return payload;
}

export type TransformerConfig = z.infer<typeof baseTransformerSchema>;
