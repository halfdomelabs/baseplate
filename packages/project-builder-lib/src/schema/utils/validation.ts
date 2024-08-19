import { z } from 'zod';

export const VALIDATORS = {
  DASHED_NAME: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9-]+$/,
      'The name should be all lowercase letters, numbers, and dashes, e.g. my-project',
    ),
  PASCAL_CASE_STRING: z
    .string()
    .regex(/^[A-Z][a-zA-Z0-9]*$/, "Should be PascalCase, e.g. 'MyModel'"),
  CAMEL_CASE_STRING: z
    .string()
    .regex(/^[a-z][a-zA-Z0-9]*$/, "Should be camelCase, e.g. 'myField'"),
  CONSTANT_CASE_STRING: z
    .string()
    .regex(/^[A-Z][A-Z0-9_]*$/, "Should be CONSTANT_CASE, e.g. 'MY_CONSTANT'"),
  OPTIONAL_CONSTANT_CASE_STRING: z
    .string()
    .regex(/^[A-Z][A-Z0-9_]*$/, "Should be CONSTANT_CASE, e.g. 'MY_CONSTANT'")
    .or(z.literal(''))
    .optional(),
};
