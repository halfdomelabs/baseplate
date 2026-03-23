import { z } from 'zod';

import { createExpressionParserRef } from '#src/references/expression-parser-ref.js';

import type { modelEntityType } from '../types.js';

/**
 * Typed reference to the authorizer expression parser.
 *
 * Used in schema definitions instead of importing the full parser class.
 * The actual parser is resolved at runtime from `expressionParserSpec`.
 */
export const authorizerExpressionRef = createExpressionParserRef<
  string,
  { model: typeof modelEntityType }
>('authorizer-expression', () => z.string().min(1, 'Expression is required'));
