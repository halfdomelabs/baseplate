import { z } from 'zod';

/**
 * Regex for validating kebab case, e.g. "my-project".
 */
export const KEBAB_CASE_REGEX = /^[a-z0-9-]+$/;

/**
 * Regex for validating pascal case, e.g. "MyProject".
 */
export const PASCAL_CASE_REGEX = /^[A-Z][a-zA-Z0-9]*$/;

/**
 * Regex for validating camel case, e.g. "myProject".
 */
export const CAMEL_CASE_REGEX = /^[a-z][a-zA-Z0-9]*$/;

/**
 * Regex for validating constant case, e.g. "MY_PROJECT".
 */
export const CONSTANT_CASE_REGEX = /^[A-Z][A-Z0-9_]*$/;

export const CASE_VALIDATORS = {
  /**
   * Zod validator for validating kebab case, e.g. "my-project".
   */
  KEBAB_CASE: z.string().regex(KEBAB_CASE_REGEX),
  /**
   * Zod validator for validating pascal case, e.g. "MyProject".
   */
  PASCAL_CASE: z.string().regex(PASCAL_CASE_REGEX),
  /**
   * Zod validator for validating camel case, e.g. "myProject".
   */
  CAMEL_CASE: z.string().regex(CAMEL_CASE_REGEX),
  /**
   * Zod validator for validating constant case, e.g. "MY_PROJECT".
   */
  CONSTANT_CASE: z.string().regex(CONSTANT_CASE_REGEX),
} as const;
