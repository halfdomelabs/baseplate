// @ts-nocheck

import fp from 'fastify-plugin';
import { logError } from '../services/error-logger';
import { HttpError, NotFoundError } from '../utils/http-errors';

/**
 * Handles errors from Fastify route handlers, sending the correct code
 * if an HttpError was thrown.
 */
export const errorHandlerPlugin = fp(async (fastify) => {
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
        reqId: request.id as string,
      });
    } else {
      await reply.code(500).send({
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: error.statusCode,
        reqId: request.id as string,
      });
    }
  });
});
