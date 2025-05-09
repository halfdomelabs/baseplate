import fp from 'fastify-plugin';

import { config } from '../services/config.js';
import { logError } from '../services/error-logger.js';
import { HttpError, NotFoundError } from '../utils/http-errors.js';

const IS_DEVELOPMENT = config.APP_ENVIRONMENT === 'development';

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
      await reply.code(error.statusCode).send({
        ...error.extraData,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        reqId: request.id,
      });
    } else if (error.statusCode && error.statusCode < 500) {
      await reply.code(error.statusCode).send({
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        reqId: request.id,
      });
    } else {
      await reply.code(500).send({
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: error.statusCode,
        reqId: request.id,
        originalError: IS_DEVELOPMENT
          ? { message: error.message, stack: error.stack }
          : undefined,
      });
    }
  });

  done();
});
