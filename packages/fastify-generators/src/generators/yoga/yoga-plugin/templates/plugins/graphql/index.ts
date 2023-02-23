// @ts-nocheck

import { config } from '%config';
import { HttpError } from '%http-errors';
import { createContextFromRequest } from '%request-service-context';
import { requestContext } from '@fastify/request-context';
import { createServer } from '@graphql-yoga/node';
import { logger } from '%logger-service';
import AltairFastify from 'altair-fastify-plugin';
import { FastifyReply, FastifyRequest, RouteHandlerMethod } from 'fastify';
import fp from 'fastify-plugin';
import { GraphQLError } from 'graphql';

const IS_DEVELOPMENT = config.APP_ENVIRONMENT === 'development';

const schema = SCHEMA;

export const graphqlPlugin = fp(async (fastify) => {
  const graphQLServer = createServer<{
    request: FastifyRequest;
    reply: FastifyReply;
  }>({
    logging: logger,
    context: ({ request, reply }) => createContextFromRequest(request, reply),
    schema,
    maskedErrors: {
      isDev: IS_DEVELOPMENT,
      formatError: (error, message, isDev) => {
        if (!(error instanceof GraphQLError)) {
          return new GraphQLError(message);
        }

        const { originalError } = error;

        if (originalError) {
          if (originalError instanceof HttpError) {
            return new GraphQLError(originalError.message, {
              ...error,
              extensions: {
                code: originalError.code,
                statusCode: originalError.statusCode,
                extraData: originalError.extraData,
                reqId: requestContext.get('reqInfo')?.id,
              },
            });
          }
        }

        return new GraphQLError(message, {
          ...error,
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
            statusCode: 500,
            reqId: requestContext.get('reqInfo')?.id,
            originalError: isDev
              ? {
                  message: originalError?.message ?? error.message,
                  stack: originalError?.stack ?? error.stack,
                }
              : undefined,
          },
        });
      },
    },
    plugins: ENVELOP_PLUGINS,
  });

  const httpHandler: RouteHandlerMethod = async (request, reply) => {
    const response = await graphQLServer.handleIncomingMessage(request, {
      request,
      reply,
    });

    // Fastify replies with promises that should not be awaited (https://github.com/typescript-eslint/typescript-eslint/issues/2640)
    /* eslint-disable @typescript-eslint/no-floating-promises */

    response.headers.forEach((value, key) => {
      reply.header(key, value);
    });

    reply.status(response.status);
    reply.send(response.body);

    return reply;
  };

  GRAPHQL_HANDLER;

  if (IS_DEVELOPMENT) {
    await fastify.register(AltairFastify, {
      path: '/altair',
      baseURL: '/altair/',
      endpointURL: '/graphql',
    });
  }
});
