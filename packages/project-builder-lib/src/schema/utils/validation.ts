import { z } from 'zod';

export const VALIDATORS = {
  PASCAL_CASE_STRING: z
    .string()
    .regex(/^[A-Z][a-zA-Z0-9]*$/, "Should be PascalCase, e.g. 'MyModel'"),
  CAMEL_CASE_STRING: z
    .string()
    .regex(/^[a-z][a-zA-Z0-9]*$/, "Should be camelCase, e.g. 'myField'"),
};
