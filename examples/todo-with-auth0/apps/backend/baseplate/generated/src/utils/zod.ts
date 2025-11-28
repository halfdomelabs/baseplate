import { ZodError } from 'zod';

import { BadRequestError } from './http-errors.js';

/**
 * Handles errors that occur during Zod request validation.
 *
 * If the provided error is an instance of `ZodError`, it formats the error details
 * and throws a `BadRequestError` with a `ZOD_VALIDATION_ERROR` code and the formatted errors.
 * If the error is not a `ZodError`, it is re-thrown as-is.
 *
 * @param {unknown} error - The error to handle. Can be any type, but typically expected
 * to be a `ZodError` when triggered by Zod validation failures.
 * @throws {BadRequestError} If the error is a `ZodError`, this throws a `BadRequestError`
 * with the formatted validation errors.
 * @throws {unknown} If the error is not a `ZodError`, it is re-thrown as-is.
 * @returns {never} This function does not return as it always throws an error.
 */
export const handleZodRequestValidationError = (error: unknown): never => {
  if (error instanceof ZodError) {
    const formattedErrors = error.issues.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));

    throw new BadRequestError('Validation failed', 'VALIDATION_ERROR', {
      errors: formattedErrors,
    });
  }

  // Re-throw non-Zod errors
  throw error;
};
