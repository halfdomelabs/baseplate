import type { z } from 'zod';

import type { DefinitionSchemaCreator } from './types.js';

export type InferSchema<T extends DefinitionSchemaCreator> = ReturnType<T>;

export type InferInput<T extends DefinitionSchemaCreator> = z.input<
  ReturnType<T>
>;

export type InferOutput<T extends DefinitionSchemaCreator> = z.output<
  ReturnType<T>
>;
