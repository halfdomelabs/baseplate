import { z } from 'zod';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type { def } from '#src/schema/creator/index.js';
import type { DefinitionSchemaCreator } from '#src/schema/creator/types.js';

export const baseTransformerFields = {
  id: z.string(),
  type: z.string().min(1),
} as const;

export const baseTransformerSchema = z.object(baseTransformerFields);

export interface ModelTransformerType<
  T extends DefinitionSchemaCreator = DefinitionSchemaCreator,
> {
  name: string;
  createSchema: T;
  getName: (
    definitionContainer: ProjectDefinitionContainer,
    definition: def.InferOutput<T>,
  ) => string;
}

export function createModelTransformerType<T extends DefinitionSchemaCreator>(
  payload: ModelTransformerType<T>,
): ModelTransformerType<T> {
  return payload;
}

export type TransformerConfig = z.infer<typeof baseTransformerSchema>;
