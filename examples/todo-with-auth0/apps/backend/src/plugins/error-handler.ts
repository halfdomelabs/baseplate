import fp from 'fastify-plugin';

import { config } from '../services/config.js';
import { logError } from '../services/error-logger.js';
import { HttpError, NotFoundError } from '../utils/http-errors.js';

const IS_DEVELOPMENT = config.APP_ENVIRONMENT === 'dev';

/**
 * Type guard to check if an error has statusCode and code properties.
 * @param error - The error to check.
 * @returns True if the error has numeric statusCode and string code.
 */
function hasStatusCode(
  error: unknown,
): error is { statusCode: number; code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof (error as { statusCode: unknown }).statusCode === 'number' &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

/**
 * Safely extracts error details from an unknown error.
 * @param error - The error to extract details from.
 * @returns Object with message and stack properties.
 */
function getErrorDetails(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  if (typeof error === 'string') {
    return { message: error };
  }
  return { message: 'Unknown error' };
}

/**
 * Handles errors from Fastify route handlers, sending the correct code
 * if an HttpError was thrown.
 */
export const errorHandlerPlugin = fp((fastify, opts, done) => {
  fastify.setNotFoundHandler((req) => {
    throw new NotFoundError(`${req.method} ${req.url} not found`);
  });

  fastify.setErrorHandler(async (error, request, reply) => {
    logError(error);

    if (error instanceof HttpError) {
      if (error.headers) {
        for (const [key, value] of Object.entries(error.headers)) {
          void reply.header(key, value);
        }
      }
      await reply.code(error.statusCode).send({
        ...error.extraData,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        reqId: request.id,
      });
    } else if (hasStatusCode(error) && error.statusCode < 500) {
      await reply.code(error.statusCode).send({
        message: getErrorDetails(error).message,
        code: error.code,
        statusCode: error.statusCode,
        reqId: request.id,
      });
    } else {
      const errorDetails = getErrorDetails(error);
      await reply.code(500).send({
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
        reqId: request.id,
        originalError: IS_DEVELOPMENT ? errorDetails : undefined,
      });
    }
  });

  done();
});
