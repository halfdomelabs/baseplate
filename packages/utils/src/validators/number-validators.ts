import { z } from 'zod';

/**
 * Zod validator for a positive integer.
 */
const POSITIVE_INT = z.number().int().positive();

/**
 * Zod number validators.
 */
export const NUMBER_VALIDATORS = {
  POSITIVE_INT,
};
